import path from "node:path";
import fs from "node:fs";


import { app } from "electron";
import { fileURLToPath } from "node:url";

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


// =====================================================
// AGENT
// =====================================================

async function startAgent() {

    try {

        /*
         * =====================================================
         * LOAD ENVIRONMENT
         * =====================================================
         *
         * Development:
         *   C:\API Tester\.env.local
         *
         * Packaged Agent:
         *   %APPDATA%\API Tester Agent\.env.local
         *
         * Never look for .env.local inside app.asar.
         */

        if (
            typeof process.loadEnvFile ===
            "function"
        ) {

            let envPath;

            if (app.isPackaged) {

                const userDataDirectory =
                    app.getPath(
                        "userData"
                    );

                fs.mkdirSync(
                    userDataDirectory,
                    {
                        recursive: true
                    }
                );

                envPath =
                    path.join(
                        userDataDirectory,
                        ".env.local"
                    );

            }
            else {

                envPath =
                    path.join(
                        __dirname,
                        "..",
                        ".env.local"
                    );

            }


            console.log(
                "API TESTER AGENT ENV:",
                envPath
            );


            if (
                fs.existsSync(
                    envPath
                )
            ) {

                process.loadEnvFile(
                    envPath
                );

            }
            else {

                console.warn(
                    "API TESTER AGENT: .env.local not found:",
                    envPath
                );

            }

        }


        console.log(
            "API TESTER AGENT STARTING"
        );


        await import(
            "../workspaceServer.js"
        );


        console.log(
            "API TESTER AGENT SERVER STARTED"
        );

    }
    catch (error) {

        console.error(
            "API TESTER AGENT FAILED",
            error
        );

        app.quit();

    }

}

// =====================================================
// READY
// =====================================================

app.whenReady().then(
  async () => {

    await startAgent();

    if (process.platform === "win32" && app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath,
        args: []
      });
    }

  }
);




// =====================================================
// KEEP RUNNING
// =====================================================

app.on(
    "window-all-closed",
    () => {
        // Agent has no window.
    }
);




