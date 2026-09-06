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



 if (app.isPackaged) {
    const userDataPath = app.getPath("userData");

    /*
     * IMPORTANT:
     * Do NOT point API_TESTER_DATA_DIRECTORY at userDataPath
     * directly. Electron/Chromium owns that directory root
     * for its own network stack (Cache, Cookies, "Network
     * Persistent State", etc.), created lazily the first time
     * something in this process actually calls fetch(). Our
     * app's own files (tokens, workspaces/, credentials) living
     * in that same root is what produces ENOTDIR the first
     * time /api/proxy/request runs. Use a dedicated subfolder
     * that Chromium's network service has no reason to touch.
     */
    const agentDataPath = path.join(userDataPath, "agent-data");

    fs.mkdirSync(agentDataPath, { recursive: true });

    process.env.API_TESTER_DATA_DIRECTORY = agentDataPath;

    process.env.API_TESTER_GOOGLE_CREDENTIALS_PATH =
        path.join(
            agentDataPath,
            "google-web-credentials.json"
        );

    console.log(
        "API TESTER USER DATA:",
        userDataPath
    );

    console.log(
        "API TESTER DATA DIRECTORY:",
        process.env.API_TESTER_DATA_DIRECTORY
    );

    console.log(
        "API TESTER GOOGLE CREDENTIALS:",
        process.env.API_TESTER_GOOGLE_CREDENTIALS_PATH
    );
}

        

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

const agentLogFile = path.join(
    app.getPath("userData"),
    "agent-error.log"
);

process.on("uncaughtException", (error) => {
    fs.appendFileSync(
        agentLogFile,
        `\n[uncaughtException]\n${error.stack || error}\n`
    );
});

process.on("unhandledRejection", (error) => {
    fs.appendFileSync(
        agentLogFile,
        `\n[unhandledRejection]\n${error?.stack || error}\n`
    );
});

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




