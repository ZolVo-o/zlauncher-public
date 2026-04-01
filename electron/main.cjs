const path = require("path");
const fs = require("fs");
const os = require("os");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { shell } = require("electron");
const { LauncherService } = require("./launcher.cjs");
const {
  parseLaunchPayload,
  parseGameDirPayload,
  parseModsDeletePayload,
  parseModsInstallPayload,
  parseModsTogglePayload,
  parsePickFilePayload,
} = require("./ipc-schemas.cjs");

const launcher = new LauncherService();
let mainWindow = null;
let versionsCache = {
  data: null,
  expiresAt: 0,
  inFlight: null,
};

function getCrashLogPath() {
  const logsDir = path.join(app.getPath("userData"), "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  return path.join(logsDir, "launcher-errors.log");
}

function writeCrashLog(context, error) {
  try {
    const row = [
      `[${new Date().toISOString()}] ${context}`,
      error?.stack || error?.message || String(error),
      "",
    ].join("\n");
    fs.appendFileSync(getCrashLogPath(), row, "utf8");
  } catch (_err) {
    // noop
  }
}

function isSafeExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch (_err) {
    return false;
  }
}

function sendToRenderer(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, payload);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1365,
    height: 820,
    minWidth: 1180,
    minHeight: 700,
    frame: false,
    backgroundColor: "#111111",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const appOrigin = devUrl ? new URL(devUrl).origin : null;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url).catch((err) => writeCrashLog("shell.openExternal", err));
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const isFile = url.startsWith("file://");
    const sameDevOrigin = Boolean(appOrigin && url.startsWith(appOrigin));
    if (isFile || sameDevOrigin) return;
    event.preventDefault();
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url).catch((err) => writeCrashLog("will-navigate", err));
    }
  });
}

async function fetchVersionsWithRetry() {
  const now = Date.now();
  if (versionsCache.data && versionsCache.expiresAt > now) {
    return versionsCache.data;
  }
  if (versionsCache.inFlight) return versionsCache.inFlight;

  versionsCache.inFlight = (async () => {
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) {
          throw new Error(`Failed to fetch versions: HTTP ${response.status}`);
        }
        const data = await response.json();
        const versions = Array.isArray(data?.versions) ? data.versions : [];
        const normalized = versions.slice(0, 200).map((item) => ({
          id: item.id,
          type: item.type,
          releaseTime: item.releaseTime,
        }));
        versionsCache = {
          data: normalized,
          expiresAt: Date.now() + 10 * 60 * 1000,
          inFlight: null,
        };
        return normalized;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
    versionsCache.inFlight = null;
    throw lastError;
  })();

  return versionsCache.inFlight;
}

function resolveGameRoot(gameDir) {
  const custom = typeof gameDir === "string" ? gameDir.trim() : "";
  if (custom) return custom;
  return path.join(os.homedir(), "AppData", "Roaming", ".zlauncher");
}

function ensureModsDir(gameDir) {
  const modsDir = path.join(resolveGameRoot(gameDir), "mods");
  fs.mkdirSync(modsDir, { recursive: true });
  return modsDir;
}

function isModFileName(fileName) {
  const lower = String(fileName || "").toLowerCase();
  return lower.endsWith(".jar") || lower.endsWith(".jar.disabled");
}

function assertSafeModFileName(fileName) {
  const normalized = String(fileName || "").trim();
  if (!normalized) {
    throw new Error("File name is required");
  }
  if (path.basename(normalized) !== normalized) {
    throw new Error("Invalid mod file name");
  }
  if (!isModFileName(normalized)) {
    throw new Error("Unsupported mod file extension");
  }
  return normalized;
}

app.whenReady().then(() => {
  createWindow();

  launcher.on("log", (payload) => sendToRenderer("launcher:event", { type: "log", payload }));
  launcher.on("status", (payload) => sendToRenderer("launcher:event", { type: "status", payload }));
  launcher.on("progress", (payload) => sendToRenderer("launcher:event", { type: "progress", payload }));
  launcher.on("error", (payload) => {
    writeCrashLog("launcher:error", payload?.message || "unknown");
    sendToRenderer("launcher:event", { type: "error", payload });
  });
  launcher.on("exit", (payload) => sendToRenderer("launcher:event", { type: "exit", payload }));

  process.on("uncaughtException", (error) => writeCrashLog("process:uncaughtException", error));
  process.on("unhandledRejection", (error) => writeCrashLog("process:unhandledRejection", error));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("launcher:start", async (_event, params) => {
  const safeParams = parseLaunchPayload(params);
  await launcher.start(safeParams);
  return { ok: true };
});

ipcMain.handle("launcher:stop", async () => {
  launcher.stop();
  return { ok: true };
});

ipcMain.handle("launcher:getVersions", async () => {
  return fetchVersionsWithRetry();
});

ipcMain.handle("dialog:pickFile", async (_event, options) => {
  const safeOptions = parsePickFilePayload(options);
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: safeOptions.filters || [],
  });
  if (result.canceled || !result.filePaths?.length) return null;
  return result.filePaths[0];
});

ipcMain.handle("dialog:pickFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths?.length) return null;
  return result.filePaths[0];
});

ipcMain.handle("mods:list", async (_event, payload) => {
  const safePayload = parseGameDirPayload(payload, "mods:list");
  const modsDir = ensureModsDir(safePayload.gameDir);
  const entries = fs.readdirSync(modsDir, { withFileTypes: true });

  const items = entries
    .filter((entry) => entry.isFile() && isModFileName(entry.name))
    .map((entry) => {
      const fullPath = path.join(modsDir, entry.name);
      const stat = fs.statSync(fullPath);
      const enabled = entry.name.toLowerCase().endsWith(".jar");
      return {
        fileName: entry.name,
        name: entry.name,
        enabled,
        size: stat.size,
        modifiedAt: stat.mtimeMs,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return {
    directory: modsDir,
    items,
  };
});

ipcMain.handle("mods:delete", async (_event, payload) => {
  const safePayload = parseModsDeletePayload(payload);
  const modsDir = ensureModsDir(safePayload.gameDir);
  const fileName = assertSafeModFileName(safePayload.fileName);

  const targetPath = path.join(modsDir, fileName);
  if (!fs.existsSync(targetPath)) {
    return { ok: false, reason: "not_found" };
  }

  fs.rmSync(targetPath, { force: true });
  return { ok: true };
});

ipcMain.handle("mods:install", async (_event, payload) => {
  const safePayload = parseModsInstallPayload(payload);
  const modsDir = ensureModsDir(safePayload.gameDir);
  const sourcePath = String(safePayload.sourcePath || "").trim();
  const overwrite = Boolean(safePayload.overwrite);

  if (!sourcePath) {
    throw new Error("Source mod path is required");
  }
  if (!fs.existsSync(sourcePath)) {
    return { ok: false, reason: "source_not_found" };
  }

  const sourceStat = fs.statSync(sourcePath);
  if (!sourceStat.isFile()) {
    return { ok: false, reason: "source_not_file" };
  }

  const fileName = path.basename(sourcePath);
  if (!fileName.toLowerCase().endsWith(".jar")) {
    return { ok: false, reason: "unsupported_extension" };
  }

  const targetPath = path.join(modsDir, fileName);
  const exists = fs.existsSync(targetPath);
  if (exists && !overwrite) {
    return { ok: false, reason: "exists", fileName };
  }

  fs.copyFileSync(sourcePath, targetPath);
  return { ok: true, fileName, replaced: exists };
});

ipcMain.handle("mods:toggle", async (_event, payload) => {
  const safePayload = parseModsTogglePayload(payload);
  const modsDir = ensureModsDir(safePayload.gameDir);
  const fileName = assertSafeModFileName(safePayload.fileName);
  const enabled = Boolean(safePayload.enabled);
  const currentPath = path.join(modsDir, fileName);

  if (!fs.existsSync(currentPath)) {
    return { ok: false, reason: "not_found" };
  }

  const lower = fileName.toLowerCase();
  const isEnabledNow = lower.endsWith(".jar");
  const isDisabledNow = lower.endsWith(".jar.disabled");

  if (!isEnabledNow && !isDisabledNow) {
    return { ok: false, reason: "unsupported_extension" };
  }

  if ((enabled && isEnabledNow) || (!enabled && isDisabledNow)) {
    return { ok: true, fileName };
  }

  const nextFileName = enabled
    ? fileName.replace(/\.disabled$/i, "")
    : `${fileName}.disabled`;
  const nextPath = path.join(modsDir, nextFileName);
  if (fs.existsSync(nextPath)) {
    return { ok: false, reason: "target_exists", fileName: nextFileName };
  }

  fs.renameSync(currentPath, nextPath);
  return { ok: true, fileName: nextFileName };
});

ipcMain.handle("mods:openFolder", async (_event, payload) => {
  const safePayload = parseGameDirPayload(payload, "mods:openFolder");
  const modsDir = ensureModsDir(safePayload.gameDir);
  const openResult = await shell.openPath(modsDir);
  if (openResult) {
    throw new Error(openResult);
  }
  return { ok: true, directory: modsDir };
});

ipcMain.handle("window:minimize", async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
  return { ok: true };
});

ipcMain.handle("window:maximize", async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return { ok: false };
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
  return { ok: true };
});

ipcMain.handle("window:close", async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
  return { ok: true };
});
