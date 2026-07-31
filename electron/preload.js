import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("apiTester", {
  version: "0.1.0",
});