console.log("electron/main.js started");
import path from "node:path";
import { app, BrowserWindow, ipcMain, Menu, dialog } from "electron";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import * as requestService from "./services/requestService.js";
import * as storageService from "./services/storageService.js";
console.log("Registering IPC handlers...");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
ipcMain.handle("api-tester:send-request", (_event, request) => requestService.execute(request));
ipcMain.handle("api-tester:load-collections", () => storageService.load());
ipcMain.handle("api-tester:save-collections", (_event, collections) => storageService.save(collections));
ipcMain.handle("api-tester:show-open-dialog", (_event, options) => {
  const window = BrowserWindow.getFocusedWindow();
  return dialog?.showOpenDialog(window,options);
});

console.log("IPC handlers registered");
ipcMain.handle("api-tester:show-save-dialog", (_event, options) => {
  const window = BrowserWindow.getFocusedWindow();
  return dialog?.showSaveDialog(window,options);
});
ipcMain.handle("api-tester:read-file", async (_event, filePath) => readFile(filePath, "utf8"));
ipcMain.handle("api-tester:write-file", async (_event, filePath, content) => writeFile(filePath, content, "utf8"));

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:5173");
}

function buildMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        { label: "New Collection", click: () => BrowserWindow.getFocusedWindow()?.webContents.send("api-tester:menu-action", "menu:new-collection") },
        { label: "Import Collection", click: () => BrowserWindow.getFocusedWindow()?.webContents.send("api-tester:menu-action", "menu:import-collection") },
        { label: "Import Environment", click: () => BrowserWindow.getFocusedWindow()?.webContents.send("api-tester:menu-action", "menu:import-environment") },
        { label: "Export Collection", click: () => BrowserWindow.getFocusedWindow()?.webContents.send("api-tester:menu-action", "menu:export-collection") },
        { label: "Export Environment", click: () => BrowserWindow.getFocusedWindow()?.webContents.send("api-tester:menu-action", "menu:export-environment") },
        { label: "Settings", enabled: false },
        { role: "quit" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
