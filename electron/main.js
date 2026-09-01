        import path from "node:path";
        import {
            app,
            BrowserWindow,
            ipcMain,
            Menu,
            dialog
        } from "electron";


        import { fileURLToPath } from "node:url";
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
        // MAIN WINDOW
        // =====================================================
        let mainWindow = null;
        let allowClose = false;

        // =====================================================
        // API REQUEST
        // =====================================================

        ipcMain.handle(
            "api-tester:send-request",
            (_event, request) =>
                requestService.execute(request)
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


            if (isDebug || !app.isPackaged) {
                mainWindow.webContents.openDevTools();
            }

            mainWindow.loadURL(
                "http://localhost:5173"
            );



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

        app.whenReady().then(() => {

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

        });


        // =====================================================
        // ALL WINDOWS CLOSED
        // =====================================================

        app.on(
            "window-all-closed",
            () => {

                if (
                    process.platform !== "darwin"
                ) {

                    app.quit();

                }

            }
        );
