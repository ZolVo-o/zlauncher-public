const { EventEmitter } = require("events");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const { spawnSync } = require("child_process");
const { Client, Authenticator } = require("minecraft-launcher-core");

function splitArgs(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeErrorMessage(error) {
  const raw = error?.message || String(error);
  const text = String(raw);

  if (/ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ECONNREFUSED|certificate|SSL/i.test(text)) {
    return `${text}\nПодсказка: ошибка сети при скачивании. Проверь VPN/прокси/фаервол и доступ к серверам Mojang.`;
  }
  if (/java/i.test(text) && /not found|ENOENT|spawn/i.test(text)) {
    return `${text}\nПодсказка: Java не найдена. Включи автоустановку зависимостей или укажи путь к Java 17+ в настройках.`;
  }
  if (/class file version|UnsupportedClassVersionError|requires Java|invalid java runtime/i.test(text)) {
    return `${text}\nПодсказка: версия Java не подходит для выбранной версии Minecraft. Попробуй включить автоустановку зависимостей.`;
  }
  if (/EACCES|EPERM|permission|Access is denied/i.test(text)) {
    return `${text}\nПодсказка: нет прав на запись в папку игры. Выбери другую папку в настройках.`;
  }
  if (/version|manifest|json/i.test(text)) {
    return `${text}\nПодсказка: не удалось скачать метаданные версии. Выбери другую версию и повтори попытку.`;
  }
  return text;
}

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (_err) {
    return false;
  }
}

function findJavaExecutable(root, depth = 4) {
  if (!exists(root) || depth < 0) return null;
  const direct = path.join(root, "bin", "javaw.exe");
  if (exists(direct)) return direct;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = findJavaExecutable(path.join(root, entry.name), depth - 1);
    if (found) return found;
  }
  return null;
}

function detectRequiredJavaMajor(mcVersion) {
  const match = String(mcVersion || "").match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return 17;
  const minor = Number(match[2] || 0);
  const patch = Number(match[3] || 0);

  // 1.20.5+ and 1.21+ require Java 21 for vanilla runtime.
  if (minor > 20 || (minor === 20 && patch >= 5)) return 21;
  if (minor >= 18) return 17;
  return 8;
}

function resolveTargetJavaMajor(settings, mcVersion) {
  const required = detectRequiredJavaMajor(mcVersion);
  const pref = settings?.javaVersionPreference || "auto";
  if (pref === "auto") return { target: required, required, mode: "auto" };
  return { target: Number(pref), required, mode: "manual" };
}

function getJavaMajorVersion(javaPath) {
  try {
    const result = spawnSync(javaPath, ["-version"], { encoding: "utf8", windowsHide: true });
    const output = `${result.stdout || ""}\n${result.stderr || ""}`;
    const quoted = output.match(/version\s+"(\d+)(?:\.(\d+))?/i);
    if (quoted) {
      const first = Number(quoted[1]);
      const second = Number(quoted[2] || 0);
      if (first === 1) return second; // 1.8 => Java 8
      return first;
    }
    const raw = output.match(/(?:jdk|openjdk)\s+(\d+)/i);
    if (raw) return Number(raw[1]);
    return null;
  } catch (_err) {
    return null;
  }
}

function downloadFile(url, destination, onProgress) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        downloadFile(response.headers.location, destination, onProgress).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Ошибка скачивания: HTTP ${response.statusCode}`));
        return;
      }

      const total = Number(response.headers["content-length"] || 0);
      let received = 0;
      const file = fs.createWriteStream(destination);

      response.on("data", (chunk) => {
        received += chunk.length;
        if (total > 0 && typeof onProgress === "function") {
          onProgress(received, total);
        }
      });

      response.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve());
      });
      file.on("error", (err) => reject(err));
    });

    request.on("error", (err) => reject(err));
  });
}

function expandZipWindows(zipPath, destination) {
  const command = `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`;
  const result = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Не удалось распаковать Java runtime: ${result.stderr || result.stdout || "неизвестная ошибка"}`);
  }
}

class LauncherService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.proc = null;
    this.pid = null;
    this.launchStartedAt = 0;
  }

  isRunning() {
    return !!this.proc;
  }

  stop() {
    if (!this.proc) return false;
    this.emit("log", { level: "WARN", source: "Launcher", message: "Останавливаю игровой процесс..." });
    this.proc.kill();
    return true;
  }

  async ensureJavaPath(settings, gameRoot, requiredJavaMajor) {
    const configured = settings?.javaPath?.trim();
    const autoInstall = settings?.autoInstallDependencies !== false;
    const runtimeRoot = path.join(gameRoot, "runtime");
    const tempDir = path.join(gameRoot, "temp");
    const runtimeArchive = path.join(tempDir, `temurin${requiredJavaMajor}-jre.zip`);
    const extractedRoot = path.join(runtimeRoot, `java-${requiredJavaMajor}`);
    const javaDownloadUrl = `https://api.adoptium.net/v3/binary/latest/${requiredJavaMajor}/ga/windows/x64/jre/hotspot/normal/eclipse`;

    if (configured && exists(configured)) {
      const configuredMajor = getJavaMajorVersion(configured);
      if (configuredMajor && configuredMajor < requiredJavaMajor) {
        throw new Error(
          `Указанная Java (${configuredMajor}) не подходит. Для версии требуется Java ${requiredJavaMajor}+.\nПуть: ${configured}`
        );
      }
      return configured;
    }

    const existingRuntimeJava = findJavaExecutable(extractedRoot) || findJavaExecutable(runtimeRoot);
    if (existingRuntimeJava) {
      const bundledMajor = getJavaMajorVersion(existingRuntimeJava);
      if (!bundledMajor || bundledMajor >= requiredJavaMajor) {
        this.emit("log", { level: "INFO", source: "Runtime", message: `Использую встроенную Java: ${existingRuntimeJava}` });
        return existingRuntimeJava;
      }
    }

    if (!autoInstall) {
      throw new Error("Java не найдена, а автоустановка зависимостей отключена.");
    }

    fs.mkdirSync(runtimeRoot, { recursive: true });
    fs.mkdirSync(tempDir, { recursive: true });

    this.emit("status", { value: "Установка Java runtime..." });
    this.emit("log", { level: "INFO", source: "Runtime", message: `Java не найдена. Скачиваю Temurin JRE ${requiredJavaMajor}...` });

    await downloadFile(javaDownloadUrl, runtimeArchive, (received, total) => {
      const value = Math.max(1, Math.min(20, Math.round((received / total) * 20)));
      this.emit("progress", { value });
    });

    this.emit("log", { level: "INFO", source: "Runtime", message: "Распаковываю Java runtime..." });
    fs.mkdirSync(extractedRoot, { recursive: true });
    expandZipWindows(runtimeArchive, extractedRoot);

    const installedJava = findJavaExecutable(extractedRoot) || findJavaExecutable(runtimeRoot);
    if (!installedJava) {
      throw new Error("Java runtime распакована, но файл javaw.exe не найден.");
    }

    this.emit("log", { level: "INFO", source: "Runtime", message: `Java runtime установлена: ${installedJava}` });
    return installedJava;
  }

  async start({ instance, settings }) {
    if (this.proc) {
      throw new Error("Игра уже запущена.");
    }

    try {
      const gameRoot = (settings?.gameDir && settings.gameDir.trim())
        ? settings.gameDir.trim()
        : path.join(os.homedir(), "AppData", "Roaming", ".zlauncher");
      if (!exists(gameRoot)) {
        fs.mkdirSync(gameRoot, { recursive: true });
      }

      const { target: targetJavaMajor, required, mode } = resolveTargetJavaMajor(settings, instance?.version);
      if (mode === "manual" && targetJavaMajor < required) {
        throw new Error(
          `Выбрана Java ${targetJavaMajor}, но для версии ${instance?.version || "latest"} требуется Java ${required}+.\n` +
            `Измени "Предпочтительная версия Java" в настройках на "Авто" или Java ${required}.`
        );
      }
      this.emit("log", {
        level: "INFO",
        source: "Runtime",
        message:
          mode === "auto"
            ? `Для версии ${instance?.version || "latest"} выбрана Java ${targetJavaMajor} (автоопределение)`
            : `Выбрана Java ${targetJavaMajor} (ручной выбор) для версии ${instance?.version || "latest"}`,
      });
      const javaPath = await this.ensureJavaPath(settings, gameRoot, targetJavaMajor);
      const minMemory = Number(settings.minMemory) || 1024;
      const maxMemory = Number(settings.maxMemory) || 4096;
      const username = settings?.username?.trim() || "Player";
      const versionType = instance?.type === "snapshot" ? "snapshot" : "release";
      const width = Number(settings.resolution?.width) || 1280;
      const height = Number(settings.resolution?.height) || 720;
      const customJavaArgs = splitArgs(settings?.jvmArgs);
      const customLaunchArgs = splitArgs(settings?.gameArgs);

      this.emit("status", { value: "Подготовка запуска..." });
      this.emit("progress", { value: 20 });
      this.emit("log", {
        level: "INFO",
        source: "Launcher",
        message: `Подготавливаю "${instance?.name || "По умолчанию"}" (${instance?.version || "latest"})`,
      });
      this.emit("log", {
        level: "INFO",
        source: "Launcher",
        message: `Папка игры: ${gameRoot}`,
      });
      this.emit("log", {
        level: "INFO",
        source: "Launcher",
        message: `Java: ${javaPath}`,
      });

      this.client = new Client();
      this.launchStartedAt = Date.now();

      this.client.on("debug", (text) => {
        this.emit("log", { level: "DEBUG", source: "MCLC", message: String(text) });
      });
      this.client.on("data", (text) => {
        this.emit("log", { level: "INFO", source: "Game", message: String(text) });
      });
      this.client.on("download", (file) => {
        this.emit("status", { value: "Скачивание файлов игры..." });
        this.emit("log", { level: "INFO", source: "Download", message: String(file) });
      });
      this.client.on("download-status", (status) => {
        const current = Number(status?.current) || 0;
        const total = Number(status?.total) || 0;
        if (total > 0) {
          const value = Math.max(20, Math.min(90, Math.round((current / total) * 90)));
          this.emit("progress", { value });
        }
      });
      this.client.on("progress", (info) => {
        const total = Number(info?.total) || 0;
        const task = Number(info?.task) || 0;
        if (total > 0) {
          const value = Math.max(20, Math.min(95, Math.round((task / total) * 95)));
          this.emit("progress", { value });
        }
      });
      this.client.on("close", (code) => {
        const elapsedSec = Math.round((Date.now() - this.launchStartedAt) / 1000);
        this.emit("log", {
          level: "INFO",
          source: "Launcher",
          message: `Игра завершена (code=${String(code)}, время=${elapsedSec}с)`,
        });
        this.emit("status", { value: "Готово" });
        this.emit("progress", { value: 0 });
        this.emit("exit", { code, signal: null });
        this.proc = null;
        this.pid = null;
        this.client = null;
      });

      const launchOptions = {
        authorization: Authenticator.getAuth(username),
        root: gameRoot,
        version: {
          number: instance?.version || "latest",
          type: versionType,
        },
        memory: {
          max: `${maxMemory}M`,
          min: `${minMemory}M`,
        },
        window: {
          width,
          height,
          fullscreen: Boolean(settings?.fullScreen),
        },
        customArgs: customJavaArgs,
        customLaunchArgs,
        javaPath,
        overrides: {
          detached: false,
          url: {
            meta: "https://piston-meta.mojang.com",
            resource: "https://resources.download.minecraft.net",
            mavenForge: "https://maven.minecraftforge.net",
            defaultRepoForge: "https://libraries.minecraft.net/",
            fallbackMaven: "https://repo1.maven.org/maven2/",
          },
        },
      };

      this.emit("status", { value: "Получение метаданных версии..." });
      const child = await this.client.launch(launchOptions);
      this.proc = child;
      this.pid = child?.pid || null;
      this.emit("progress", { value: 100 });
      this.emit("status", { value: "Игра запущена" });
      this.emit("log", {
        level: "INFO",
        source: "Launcher",
        message: `Process PID: ${this.pid || "unknown"}`,
      });
    } catch (err) {
      const message = normalizeErrorMessage(err);
      this.emit("status", { value: "Ошибка запуска" });
      this.emit("progress", { value: 0 });
      this.emit("error", { message });
      this.proc = null;
      this.pid = null;
      this.client = null;
      throw err;
    }
  }
}

module.exports = { LauncherService };
