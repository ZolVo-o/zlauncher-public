const path = require("path");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
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

app.whenReady().then(() => {
  createWindow();

  launcher.on("log", (payload) => sendToRenderer("launcher:event", { type: "log", payload }));
  launcher.on("status", (payload) => sendToRenderer("launcher:event", { type: "status", payload }));
  launcher.on("progress", (payload) => sendToRenderer("launcher:event", { type: "progress", payload }));
  launcher.on("error", (payload) => sendToRenderer("launcher:event", { type: "error", payload }));
  launcher.on("exit", (payload) => sendToRenderer("launcher:event", { type: "exit", payload }));
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
