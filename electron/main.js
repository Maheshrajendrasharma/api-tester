import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as requestService from "./services/requestService.js";
import * as storageService from "./services/storageService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
ipcMain.handle("api-tester:send-request", (_event, request) => requestService.execute(request));
ipcMain.handle("api-tester:load-collections", () => storageService.load());
ipcMain.handle("api-tester:save-collections", (_event, collections) => storageService.save(collections));

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

app.whenReady().then(() => {
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
