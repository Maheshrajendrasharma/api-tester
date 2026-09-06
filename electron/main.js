            import path from "node:path";
import {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    dialog,
    Tray,
    nativeImage
} from "electron";

            import { fileURLToPath } from "node:url";
            import http from "node:http";
            import { readFile, writeFile } from "node:fs/promises";

            import * as requestService from "./services/requestService.js";
            import * as storageService from "./services/storageService.js";

            const isDebug = process.env.API_TESTER_DEBUG === "true";
            const debugLog = (...args) => {
                if (isDebug) console.info(...args);
            };

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);



            // =====================================================
// ELECTRON PERSISTENT USER DATA
// =====================================================

const electronUserDataPath = path.join(
    app.getPath("appData"),
    "API Tester"
);

app.setPath("userData", electronUserDataPath);

console.log(
    "[ELECTRON] Persistent user data:",
    electronUserDataPath
);

            // =====================================================
            // MAIN WINDOW
            // =====================================================
    let mainWindow = null;

    const isAgentMode = process.argv.includes(
            "--agent"
        );
let googleDriveService = null;
let googleOAuthServer = null;
let googleOAuthWindow = null;



async function loadGoogleDriveService() {
    if (googleDriveService) {
        return googleDriveService;
    }

    googleDriveService = await import(
        "../googleDriveService.js"
    );

    return googleDriveService;
}


async function startGoogleOAuthCallbackServer() {
    if (googleOAuthServer) {
        return;
    }

    const service = await loadGoogleDriveService();

    googleOAuthServer = http.createServer(
        async (request, response) => {
            try {
                const callbackUrl = new URL(
                    request.url || "/",
                    "http://localhost:3001"
                );

                if (
                    callbackUrl.pathname !==
                    "/oauth2callback"
                ) {
                    response.writeHead(404);
                    response.end("Not Found");
                    return;
                }

                const query =
                    Object.fromEntries(
                        callbackUrl.searchParams.entries()
                    );

                console.log(
                    "[GOOGLE OAUTH] Electron callback received."
                );

                await service.handleOAuthCallback(
                    query
                );

                response.writeHead(
                    200,
                    {
                        "Content-Type":
                            "text/html; charset=utf-8"
                    }
                );

                response.end(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="utf-8">
                            <title>Google Drive Connected</title>
                        </head>
                        <body>
                            <h2>Google Drive connected successfully.</h2>
                            <p>You can close this browser window.</p>
                        </body>
                    </html>
                `);

if (
    googleOAuthWindow &&
    !googleOAuthWindow.isDestroyed()
) {
    googleOAuthWindow.close();
    googleOAuthWindow = null;
}

if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();

    mainWindow.webContents.send(
        "api-tester:google-drive-connected"
    );
}
            }
            catch (error) {
                console.error(
                    "[GOOGLE OAUTH CALLBACK] Failed:",
                    error
                );

                response.writeHead(
                    500,
                    {
                        "Content-Type":
                            "text/html; charset=utf-8"
                    }
                );

                response.end(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="utf-8">
                            <title>Google Drive Connection Failed</title>
                        </head>
                        <body>
                            <h2>Google Drive connection failed.</h2>
                            <p>${String(
                                error?.message ||
                                "Unknown error"
                            )}</p>
                            <p>You can close this browser window.</p>
                        </body>
                    </html>
                `);
            }
        }
    );

    await new Promise(
        (resolve, reject) => {
            googleOAuthServer.once(
                "error",
                reject
            );

            googleOAuthServer.listen(
                3001,
                "127.0.0.1",
                () => {
                    console.log(
                        "[GOOGLE OAUTH] Electron callback server listening on port 3001."
                    );

                    resolve();
                }
            );
        }
    );
}

    async function startAgentServer() {

        try {

            if (
                typeof process.loadEnvFile ===
                "function"
            ) {

                process.loadEnvFile(
                    path.join(
                        __dirname,
                        "..",
                        ".env.local"
                    )
                );

            }

            await import(
                "../workspaceServer.js"
            );

            console.log(
                "API Tester Agent server started."
            );

        }
        catch (error) {

            console.error(
                "API Tester Agent server failed:",
                error
            );

            throw error;

        }

    }
        let agentTray = null;


                let allowClose = false;

            // =====================================================
            // API REQUEST
            // =====================================================

            ipcMain.handle(
                "api-tester:send-request",
                (_event, request) =>
                    requestService.execute(request)
            );


            // =====================================================
// GOOGLE DRIVE
// =====================================================

ipcMain.handle(
    "api-tester:google-sign-in",
    async (_event, accessToken) => {
        if (!accessToken) {
            throw new Error(
                "Supabase access token is required."
            );
        }

        const supabaseModule =
            await import("@supabase/supabase-js");

        const supabaseUrl =
            process.env.VITE_SUPABASE_URL;

        const supabasePublishableKey =
            process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (
            !supabaseUrl ||
            !supabasePublishableKey
        ) {
            throw new Error(
                "Supabase environment variables are missing in Electron."
            );
        }

        const supabaseClient =
            supabaseModule.createClient(
                supabaseUrl,
                supabasePublishableKey,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser(
                accessToken
            );

        if (error) {
            throw error;
        }

        if (!data?.user?.id) {
            throw new Error(
                "Unable to determine the authenticated user."
            );
        }

        await startGoogleOAuthCallbackServer();

        const service =
            await loadGoogleDriveService();

        const authUrl =
            await service.getAuthorizationUrl(
                data.user.id,
                accessToken
            );

        console.log(
    "[GOOGLE OAUTH] Opening Google authorization inside Electron."
);

if (
    googleOAuthWindow &&
    !googleOAuthWindow.isDestroyed()
) {
    googleOAuthWindow.focus();

    return {
        started: true
    };
}

googleOAuthWindow = new BrowserWindow({
    width: 520,
    height: 760,
    parent: mainWindow || undefined,
    modal: false,
    title: "Connect Google Drive",
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
    }
});

googleOAuthWindow.on(
    "closed",
    () => {
        googleOAuthWindow = null;
    }
);

await googleOAuthWindow.loadURL(
    authUrl
);

return {
    started: true
};
    }
);

ipcMain.handle(
    "api-tester:google-auth-status",
    async () => {
        const service =
            await loadGoogleDriveService();

        return service.getAuthStatus();
    }
);

ipcMain.handle(
    "api-tester:google-sign-out",
    async () => {
        const service =
            await loadGoogleDriveService();

        return service.signOut();
    }
);


ipcMain.handle(
    "api-tester:google-upload-workspace",
    async (_event, state) => {
        const service =
            await loadGoogleDriveService();

        return service.uploadWorkspaceState(state);
    }
);

ipcMain.handle(
    "api-tester:google-download-workspace",
    async () => {
        const service =
            await loadGoogleDriveService();

        return service.downloadWorkspaceState();
    }
);





            ipcMain.handle(
                "api-tester:cancel-request",
                (_event, requestId) => {

                    const result =
                        requestService.cancelRequest(
                            requestId
                        )

                    debugLog("[CANCEL IPC]", Boolean(result))

                    return result
                }
            )

            // =====================================================
            // COLLECTIONS
            // =====================================================

            ipcMain.handle(
                "api-tester:load-collections",
                () => storageService.load()
            );

            ipcMain.handle(
                "api-tester:save-collections",
                (_event, collections) =>
                    storageService.save(collections)
            );


            // =====================================================
            // FILE DIALOGS
            // =====================================================

            ipcMain.handle(
                "api-tester:show-open-dialog",
                (_event, options) => {

                    const window =
                        BrowserWindow.getFocusedWindow();

                    return dialog.showOpenDialog(
                        window,
                        options
                    );
                }
            );


            ipcMain.handle(
                "api-tester:show-save-dialog",
                (_event, options) => {

                    const window =
                        BrowserWindow.getFocusedWindow();

                    return dialog.showSaveDialog(
                        window,
                        options
                    );
                }
            );


            ipcMain.handle(
                "api-tester:read-file",
                async (_event, filePath) => {

                    return readFile(
                        filePath,
                        "utf8"
                    );
                }
            );


            ipcMain.handle(
                "api-tester:write-file",
                async (_event, filePath, content) => {

                    return writeFile(
                        filePath,
                        content,
                        "utf8"
                    );
                }
            );


            // =====================================================
            // WINDOW - MINIMIZE
            // =====================================================

            ipcMain.handle(
                "api-tester:minimize-window",
                (event) => {

                    const window =
                        BrowserWindow.fromWebContents(
                            event.sender
                        );

                    if (window) {
                        window.minimize();
                    }
                }
            );


            // =====================================================
            // WINDOW - MAXIMIZE / RESTORE
            // =====================================================

            ipcMain.handle(
                "api-tester:maximize-window",
                (event) => {

                    const window =
                        BrowserWindow.fromWebContents(
                            event.sender
                        );

                    if (!window) {
                        return;
                    }

                    if (window.isMaximized()) {

                        window.unmaximize();

                    } else {

                        window.maximize();
                    }
                }
            );


            // =====================================================
            // WINDOW - CLOSE REQUEST
            // =====================================================
            ipcMain.handle(
                "api-tester:close-window",
                () => {

                    if (mainWindow) {

                        mainWindow.webContents.send(
                            "api-tester:request-close"
                        );

                    }

                    return true;
                }
            );




            // =====================================================
            // WINDOW - FORCE CLOSE
            // =====================================================

            ipcMain.handle(
                "api-tester:force-close",
                (event) => {

                    const window =
                        BrowserWindow.fromWebContents(
                            event.sender
                        );

                    if (window) {
                        window.destroy();
                    }
                }
            );  



            // =====================================================
            // CREATE WINDOW
            // =====================================================

            function createWindow() {
                mainWindow = new BrowserWindow({
                    width: 1400,
                    height: 900,

                    minWidth: 900,
                    minHeight: 600,

                    // Keep the custom application UI,
                    // but allow Windows to provide native caption buttons.
                    frame: false,

                    titleBarStyle: "hidden",

                    titleBarOverlay: {
                        color: "#10151c",
                        symbolColor: "#9fb3c8",
                        height: 46,
                    },

                    webPreferences: {
                        preload: path.join(
                            __dirname,
                            "preload.cjs"
                        ),

                        contextIsolation: true,
                        nodeIntegration: false,
                    },
                });


    mainWindow.webContents.openDevTools({
        mode: "detach"
    });

if (app.isPackaged) {
    mainWindow.loadFile(
        path.join(
            __dirname,
            "../dist/index.html"
        )
    );
} else {
    mainWindow.loadURL(
        "http://localhost:5173"
    );
}



                mainWindow.on(
                "close",
                (event) => {

                    if (allowClose) {
                        return;
                    }

                    event.preventDefault();

                    mainWindow.webContents.send(
                        "api-tester:request-close"
                    );
                }
            );



                mainWindow.on(
                    "closed",
                    () => {
                        mainWindow = null;
                    }
                );
            }




            // =====================================================
            // MENU
            // =====================================================

            function buildMenu() {

                Menu.setApplicationMenu(null);
            }


            // =====================================================
            // APP READY
            // =====================================================

    app.whenReady().then(
        async () => {

            console.log(
                "ELECTRON APP READY"
            );

                    if (
            typeof process.loadEnvFile ===
            "function"
        ) {
            try {
                process.loadEnvFile(
                    path.join(
                        __dirname,
                        "..",
                        ".env.local"
                    )
                );
            }
            catch (error) {
                console.warn(
                    "[ENV] Could not load .env.local:",
                    error?.message
                );
            }
        }

    if (
        isAgentMode
    ) {

        console.log(
            "API TESTER AGENT MODE"
        );

        await startAgentServer();

        console.log(
            "API TESTER AGENT IS RUNNING"
        );

        if (
        isAgentMode &&
        app.isPackaged &&
        process.platform === "win32"
    ) {

        app.setLoginItemSettings({
            openAtLogin: true,
            path: process.execPath,
            args: [
                "--agent"
            ]
        });

        console.log(
            "API TESTER AGENT AUTO-START ENABLED"
        );

    }

        await new Promise(
            () => {}
        );

    }


            buildMenu();

            createWindow();


            app.on(
                "activate",
                () => {

                    if (
                        BrowserWindow
                            .getAllWindows()
                            .length === 0
                    ) {

                        createWindow();

                    }

                }
            );

        }
    );

            // =====================================================
            // ALL WINDOWS CLOSED
            // =====================================================

    app.on(
        "window-all-closed",
        () => {

            if (
                isAgentMode
            ) {
                return;
            }

            if (
                process.platform !== "darwin"
            ) {

                app.quit();

            }

        }
    );
