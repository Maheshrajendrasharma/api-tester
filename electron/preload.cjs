const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("apiTester", {
  version: "0.1.0",

  sendRequest: (request) =>
    ipcRenderer.invoke("api-tester:send-request", request),
});