import path from "node:path";
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

        if (
            typeof process.loadEnvFile ===
            "function"
        ) {

            const envPath =
                path.join(
                    __dirname,
                    "..",
                    ".env.local"
                );

            process.loadEnvFile(
                envPath
            );
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