const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("zlauncher", {
  isDesktop: true,
  startLaunch: (payload) => ipcRenderer.invoke("launcher:start", payload),
  stopLaunch: () => ipcRenderer.invoke("launcher:stop"),
  getVersions: () => ipcRenderer.invoke("launcher:getVersions"),
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
