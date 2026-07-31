import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const supportedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

ipcMain.handle("api-tester:send-request", async (_event, request) => {
  const { method, url, headers = {}, body = "" } = request ?? {};

  if (!supportedMethods.has(method)) {
    throw new Error("Unsupported HTTP method.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Please enter a valid request URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  const requestOptions = { method, headers };
  if (body && method !== "GET") {
    requestOptions.body = body;
  }

  const startedAt = performance.now();
  const response = await fetch(parsedUrl, requestOptions);
  const responseBody = await response.text();

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    responseBody,
    responseTime: Math.round(performance.now() - startedAt),
    responseSize: Buffer.byteLength(responseBody, "utf8"),
  };
});

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
