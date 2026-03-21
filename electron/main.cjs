const path = require("path");
const fs = require("fs");
const os = require("os");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { shell } = require("electron");
const { LauncherService } = require("./launcher.cjs");

const launcher = new LauncherService();
let mainWindow = null;

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
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
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
  launcher.on("error", (payload) => sendToRenderer("launcher:event", { type: "error", payload }));
  launcher.on("exit", (payload) => sendToRenderer("launcher:event", { type: "exit", payload }));
});

app.on("before-quit", () => {
  launcher.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("launcher:start", async (_event, params) => {
  await launcher.start(params);
  return { ok: true };
});

ipcMain.handle("launcher:stop", async () => {
  launcher.stop();
  return { ok: true };
});

ipcMain.handle("launcher:getVersions", async () => {
  const response = await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch versions: HTTP ${response.status}`);
  }
  const data = await response.json();
  const versions = Array.isArray(data?.versions) ? data.versions : [];
  return versions.slice(0, 200).map((item) => ({
    id: item.id,
    type: item.type,
    releaseTime: item.releaseTime,
  }));
});

ipcMain.handle("dialog:pickFile", async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: options?.filters || [],
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
  const modsDir = ensureModsDir(payload?.gameDir);
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
  const modsDir = ensureModsDir(payload?.gameDir);
  const fileName = assertSafeModFileName(payload?.fileName);

  const targetPath = path.join(modsDir, fileName);
  if (!fs.existsSync(targetPath)) {
    return { ok: false, reason: "not_found" };
  }

  fs.rmSync(targetPath, { force: true });
  return { ok: true };
});

ipcMain.handle("mods:install", async (_event, payload) => {
  const modsDir = ensureModsDir(payload?.gameDir);
  const sourcePath = String(payload?.sourcePath || "").trim();
  const overwrite = Boolean(payload?.overwrite);

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
  const modsDir = ensureModsDir(payload?.gameDir);
  const fileName = assertSafeModFileName(payload?.fileName);
  const enabled = Boolean(payload?.enabled);
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
  const modsDir = ensureModsDir(payload?.gameDir);
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
