const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("apiTester", {
  version: "0.1.0",

  sendRequest: (request) =>
    ipcRenderer.invoke("api-tester:send-request", request),

  loadCollections: () =>
    ipcRenderer.invoke("api-tester:load-collections"),

  saveCollections: (collections) =>
    ipcRenderer.invoke("api-tester:save-collections", collections),

  showOpenDialog: (options) =>
    ipcRenderer.invoke("api-tester:show-open-dialog", options),

  showSaveDialog: (options) =>
    ipcRenderer.invoke("api-tester:show-save-dialog", options),

  readFile: (filePath) =>
    ipcRenderer.invoke("api-tester:read-file", filePath),

  writeFile: (filePath, content) =>
    ipcRenderer.invoke("api-tester:write-file", filePath, content),

  // CLOSE ELECTRON WINDOW
 closeWindow: () => {
  console.log("PRELOAD CLOSE CALLED");
  return ipcRenderer.invoke("api-tester:close-window");
},

  onMenuAction: (callback) => {
    const channel = "api-tester:menu-action";

    const listener = (_event, action) => callback(action);

    ipcRenderer.on(channel, listener);

    return () => ipcRenderer.removeListener(channel, listener);
  },
});