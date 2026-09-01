const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("apiTester", {
    version: "0.1.0",



    



    // ---------------------------------------
    // API REQUEST
    // ---------------------------------------

    sendRequest: (request) =>
        ipcRenderer.invoke("api-tester:send-request", request),


    cancelRequest: (requestId) =>
    ipcRenderer.invoke(
        "api-tester:cancel-request",
        requestId
    ),


    

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
// GOOGLE DRIVE
// ---------------------------------------

googleSignIn: () =>
    ipcRenderer.invoke(
        "api-tester:google-sign-in"
    ),

googleAuthStatus: () =>
    ipcRenderer.invoke(
        "api-tester:google-auth-status"
    ),

googleSignOut: () =>
    ipcRenderer.invoke(
        "api-tester:google-sign-out"
    ),



// ---------------------------------------
// WINDOW CONTROLS
// ---------------------------------------

minimizeWindow: () => {
    return ipcRenderer.invoke(
        "api-tester:minimize-window"
    );
},

maximizeWindow: () => {
    return ipcRenderer.invoke(
        "api-tester:maximize-window"
    );
},

closeWindow: () => {
    return ipcRenderer.invoke(
        "api-tester:close-window"
    );
},

forceCloseWindow: () => {
    return ipcRenderer.invoke(
        "api-tester:force-close"
    );
},

onRequestClose: (callback) => {

    const listener = () => {
        callback();
    };

    ipcRenderer.on(
        "api-tester:request-close",
        listener
    );

    return () => {

        ipcRenderer.removeListener(
            "api-tester:request-close",
            listener
        );

    };
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
