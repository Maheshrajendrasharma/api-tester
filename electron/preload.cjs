const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("apiTester", {
    version: "0.1.0",

    // ---------------------------------------
    // API REQUEST
    // ---------------------------------------

    sendRequest: (request) =>
        ipcRenderer.invoke("api-tester:send-request", request),

    // ---------------------------------------
    // COLLECTIONS
    // ---------------------------------------

    loadCollections: () =>
        ipcRenderer.invoke("api-tester:load-collections"),

    saveCollections: (collections) =>
        ipcRenderer.invoke("api-tester:save-collections", collections),

    // ---------------------------------------
    // FILE DIALOGS
    // ---------------------------------------

    showOpenDialog: (options) =>
        ipcRenderer.invoke("api-tester:show-open-dialog", options),

    showSaveDialog: (options) =>
        ipcRenderer.invoke("api-tester:show-save-dialog", options),

    readFile: (filePath) =>
        ipcRenderer.invoke("api-tester:read-file", filePath),

    writeFile: (filePath, content) =>
        ipcRenderer.invoke("api-tester:write-file", filePath, content),

    // ---------------------------------------
    // WINDOW CONTROLS
    // ---------------------------------------

    minimizeWindow: () => {
        console.log("PRELOAD: MINIMIZE");
        return ipcRenderer.invoke("api-tester:minimize-window");
    },

    maximizeWindow: () => {
        console.log("PRELOAD: MAXIMIZE");
        return ipcRenderer.invoke("api-tester:maximize-window");
    },

    closeWindow: () => {
        console.log("PRELOAD: CLOSE");
        return ipcRenderer.invoke("api-tester:close-window");
    },

    // ---------------------------------------
    // MENU ACTION
    // ---------------------------------------

    onMenuAction: (callback) => {
        const channel = "api-tester:menu-action";

        const listener = (_event, action) => {
            callback(action);
        };

        ipcRenderer.on(channel, listener);

        return () => {
            ipcRenderer.removeListener(channel, listener);
        };
    },
});