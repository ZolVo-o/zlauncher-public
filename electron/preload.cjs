const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("zlauncher", {
  isDesktop: true,
  startLaunch: (payload) => ipcRenderer.invoke("launcher:start", payload),
  stopLaunch: () => ipcRenderer.invoke("launcher:stop"),
  getVersions: () => ipcRenderer.invoke("launcher:getVersions"),
  listMods: (gameDir) => ipcRenderer.invoke("mods:list", { gameDir }),
  deleteMod: (gameDir, fileName) => ipcRenderer.invoke("mods:delete", { gameDir, fileName }),
  installMod: (gameDir, sourcePath, overwrite) => ipcRenderer.invoke("mods:install", { gameDir, sourcePath, overwrite }),
  toggleMod: (gameDir, fileName, enabled) => ipcRenderer.invoke("mods:toggle", { gameDir, fileName, enabled }),
  openModsFolder: (gameDir) => ipcRenderer.invoke("mods:openFolder", { gameDir }),
  pickFile: (filters) => ipcRenderer.invoke("dialog:pickFile", { filters }),
  pickFolder: () => ipcRenderer.invoke("dialog:pickFolder"),
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("window:maximize"),
  windowClose: () => ipcRenderer.invoke("window:close"),
  onLauncherEvent: (handler) => {
    const wrapped = (_event, data) => handler(data);
    ipcRenderer.on("launcher:event", wrapped);
    return () => ipcRenderer.removeListener("launcher:event", wrapped);
  },
});
