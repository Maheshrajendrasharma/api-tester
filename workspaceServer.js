import http from "node:http"
import path from "node:path"

import * as googleDriveService
    from "./googleDriveService.js"

import { fileURLToPath } from "node:url"

import {
    mkdir,
    readFile,
    writeFile,
    rename,
    copyFile
} from "node:fs/promises"



const __filename =
    fileURLToPath(
        import.meta.url
    )


const __dirname =
    path.dirname(
        __filename
    )


const PORT = 3001


const DATA_DIRECTORY =
    path.join(
        __dirname,
        ".api-tester-data"
    )


const DATA_FILE =
    path.join(
        DATA_DIRECTORY,
        "workspace-state.json"
    )


/*
 * =========================================================
 * DEFAULT WORKSPACE STATE
 * =========================================================
 */

function createDefaultState() {

    return {

        workspaces: [],

        activeWorkspaceId: null,

        updatedAt:
            new Date().toISOString()

    }

}


/*
 * =========================================================
 * ENSURE DATA DIRECTORY
 * =========================================================
 */

async function ensureDataDirectory() {

    await mkdir(
        DATA_DIRECTORY,
        {
            recursive: true
        }
    )

}


/*
 * =========================================================
 * NORMALIZE STATE
 * =========================================================
 */

function normalizeState(state) {

    return {

        workspaces:
            Array.isArray(
                state?.workspaces
            )
                ? state.workspaces
                : [],

        activeWorkspaceId:
            state?.activeWorkspaceId ??
            null,

        updatedAt:
            state?.updatedAt ??
            new Date().toISOString()

    }

}


/*
 * =========================================================
 * HTML ESCAPE
 * =========================================================
 */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#39;"
        )

}


/*
 * =========================================================
 * READ WORKSPACE STATE
 * =========================================================
 *
 * Handles:
 *
 * 1. Missing file
 * 2. Valid file
 * 3. Corrupted JSON
 *
 * If corruption is detected, the bad file is backed up
 * and replaced with a fresh valid state.
 * =========================================================
 */

async function readWorkspaceState() {

    await ensureDataDirectory()


    try {

        const content =
            await readFile(
                DATA_FILE,
                "utf8"
            )


        try {

            const parsed =
                JSON.parse(
                    content
                )


            return normalizeState(
                parsed
            )

        }
        catch (parseError) {

            const backupFile =
                path.join(
                    DATA_DIRECTORY,
                    `workspace-state-corrupt-${Date.now()}.json`
                )


            try {

                await copyFile(
                    DATA_FILE,
                    backupFile
                )


                console.error(
                    "[WORKSPACE] Corrupted workspace file detected."
                )


                console.error(
                    `[WORKSPACE] Backup created: ${backupFile}`
                )

            }
            catch (backupError) {

                console.error(
                    "[WORKSPACE] Failed to backup corrupted file:",
                    backupError
                )

            }


            const freshState =
                createDefaultState()


            await writeFile(
                DATA_FILE,
                JSON.stringify(
                    freshState,
                    null,
                    2
                ),
                "utf8"
            )


            console.error(
                "[WORKSPACE] Created fresh workspace state."
            )


            return freshState

        }

    }
    catch (error) {

        if (
            error.code === "ENOENT"
        ) {

            const freshState =
                createDefaultState()


            await writeFile(
                DATA_FILE,
                JSON.stringify(
                    freshState,
                    null,
                    2
                ),
                "utf8"
            )


            return freshState

        }


        throw error

    }

}


/*
 * =========================================================
 * WRITE QUEUE
 * =========================================================
 */

let writeQueue =
    Promise.resolve()


function saveWorkspaceState(
    state
) {

    writeQueue =
        writeQueue.then(
            async () => {

                await ensureDataDirectory()


                const nextState =
                    normalizeState(
                        state
                    )


                nextState.updatedAt =
                    new Date().toISOString()


                const tempFile =
                    `${DATA_FILE}.tmp`


                await writeFile(
                    tempFile,
                    JSON.stringify(
                        nextState,
                        null,
                        2
                    ),
                    "utf8"
                )


                await rename(
                    tempFile,
                    DATA_FILE
                )


                return nextState

            }
        )


    return writeQueue

}


/*
 * =========================================================
 * SEND JSON
 * =========================================================
 */

function sendJson(
    response,
    statusCode,
    data
) {

    response.writeHead(
        statusCode,
        {

            "Content-Type":
                "application/json; charset=utf-8",

            "Access-Control-Allow-Origin":
                "*",

            "Access-Control-Allow-Methods":
                "GET, POST, OPTIONS",

            "Access-Control-Allow-Headers":
                "Content-Type"

        }
    )


    response.end(
        JSON.stringify(
            data
        )
    )

}


/*
 * =========================================================
 * READ REQUEST BODY
 * =========================================================
 */

async function readRequestBody(
    request
) {

    const chunks = []


    for await (
        const chunk of request
    ) {

        chunks.push(
            chunk
        )

    }


    const body =
        Buffer
            .concat(
                chunks
            )
            .toString(
                "utf8"
            )


    if (!body) {

        return {}

    }


    return JSON.parse(
        body
    )

}


/*
 * =========================================================
 * SERVER
 * =========================================================
 */

const server =
    http.createServer(
        async (
            request,
            response
        ) => {

            try {

                /*
                 * -----------------------------------------
                 * CORS PREFLIGHT
                 * -----------------------------------------
                 */

                if (
                    request.method ===
                    "OPTIONS"
                ) {

                    response.writeHead(
                        204,
                        {

                            "Access-Control-Allow-Origin":
                                "*",

                            "Access-Control-Allow-Methods":
                                "GET, POST, OPTIONS",

                            "Access-Control-Allow-Headers":
                                "Content-Type"

                        }
                    )


                    response.end()

                    return

                }


                /*
                 * -----------------------------------------
                 * HEALTH
                 * -----------------------------------------
                 */

                if (
                    request.url ===
                    "/health"
                ) {

                    sendJson(
                        response,
                        200,
                        {
                            status: "ok"
                        }
                    )


                    return

                }


                /*
                 * =================================================
                 * GOOGLE AUTH - START
                 * =================================================
                 *
                 * Browser/Vite:
                 *
                 *   /api/google/auth/start
                 *
                 * redirects to Google.
                 * =================================================
                 */

                if (
                    request.url ===
                    "/api/google/auth/start"
                    &&
                    request.method ===
                    "GET"
                ) {

                    const authUrl =
                        await googleDriveService
                            .getAuthorizationUrl()


                    response.writeHead(
                        302,
                        {
                            Location:
                                authUrl
                        }
                    )


                    response.end()

                    return

                }


                /*
                 * =================================================
                 * GOOGLE AUTH - CALLBACK
                 * =================================================
                 *
                 * Google redirects here after consent.
                 * =================================================
                 */

                if (
                    request.url?.startsWith(
                        "/oauth2callback"
                    )
                    &&
                    request.method ===
                    "GET"
                ) {

                    const callbackUrl =
                        new URL(
                            request.url,
                            "http://localhost:3001"
                        )


                    const query =
                        Object.fromEntries(
                            callbackUrl
                                .searchParams
                                .entries()
                        )


                    try {

                        await googleDriveService
                            .handleOAuthCallback(
                                query
                            )


                        /*
                         * Return to the Vite application.
                         *
                         * This works for both:
                         *
                         * Chrome/Vite
                         * Electron -> its Vite renderer
                         */

                        response.writeHead(
                            302,
                            {

                                Location:
                                    "http://localhost:5173/?googleDrive=connected"

                            }
                        )


                        response.end()


                    }
                    catch (error) {

                        console.error(
                            "[GOOGLE OAUTH CALLBACK]",
                            error
                        )


                        response.writeHead(
                            500,
                            {

                                "Content-Type":
                                    "text/html; charset=utf-8"

                            }
                        )


                        response.end(
                            `
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <meta charset="utf-8">
                                    <title>Google Drive Connection Failed</title>
                                </head>

                                <body>
                                    <h2>
                                        Google Drive connection failed
                                    </h2>

                                    <p>
                                        ${escapeHtml(
                                            error?.message ||
                                            "Unknown error"
                                        )}
                                    </p>

                                    <p>
                                        You can close this window.
                                    </p>
                                </body>
                            </html>
                            `
                        )

                    }


                    return

                }


                /*
                 * =================================================
                 * GOOGLE AUTH - STATUS
                 * =================================================
                 */

                if (
                    request.url ===
                    "/api/google/auth/status"
                    &&
                    request.method ===
                    "GET"
                ) {

                    const status =
                        await googleDriveService
                            .getAuthStatus()


                    sendJson(
                        response,
                        200,
                        status
                    )


                    return

                }


                /*
                 * =================================================
                 * GOOGLE AUTH - LOGOUT
                 * =================================================
                 */

                if (
                    request.url ===
                    "/api/google/auth/logout"
                    &&
                    request.method ===
                    "POST"
                ) {

                    await googleDriveService
                        .signOut()


                    sendJson(
                        response,
                        200,
                        {
                            authenticated:
                                false,

                            user:
                                null
                        }
                    )


                    return

                }


                /*
 * =================================================
 * GOOGLE DRIVE WORKSPACE - ENSURE
 * =================================================
 */

if (
    request.url ===
    "/api/google/drive/workspace"
    &&
    request.method ===
    "GET"
) {

    const result =
        await googleDriveService
            .ensureDriveWorkspace();


    sendJson(
        response,
        200,
        result
    );


    return;

}


/*
 * =================================================
 * GOOGLE DRIVE WORKSPACE - UPLOAD
 * =================================================
 */

if (
    request.url ===
    "/api/google/drive/upload"
    &&
    request.method ===
    "POST"
) {

    const body =
        await readRequestBody(
            request
        );


    const result =
        await googleDriveService
            .uploadWorkspaceState(
                body
            );


    sendJson(
        response,
        200,
        result
    );


    return;

}





/*
 * =================================================
 * GOOGLE DRIVE WORKSPACE - UPLOAD
 * =================================================
 */

if (
    request.url ===
    "/api/google/drive/upload"
    &&
    request.method ===
    "POST"
) {

    const body =
        await readRequestBody(
            request
        );


    const result =
        await googleDriveService
            .uploadWorkspaceState(
                body
            );


    sendJson(
        response,
        200,
        result
    );


    return;

}





/*
 * =================================================
 * GOOGLE DRIVE WORKSPACE - DOWNLOAD
 * =================================================
 */

if (
    request.url ===
    "/api/google/drive/download"
    &&
    request.method ===
    "GET"
) {

    const result =
        await googleDriveService
            .downloadWorkspaceState();


    sendJson(
        response,
        200,
        result
    );


    return;

}


                /*
                 * =================================================
                 * WORKSPACE STATE - GET
                 * =================================================
                 */

                if (
                    request.url ===
                    "/api/workspace-state"
                    &&
                    request.method ===
                    "GET"
                ) {

                    const state =
                        await readWorkspaceState()


                    sendJson(
                        response,
                        200,
                        state
                    )


                    return

                }


                /*
                 * =================================================
                 * WORKSPACE STATE - POST
                 * =================================================
                 */

                if (
                    request.url ===
                    "/api/workspace-state"
                    &&
                    request.method ===
                    "POST"
                ) {

                    const body =
                        await readRequestBody(
                            request
                        )


                    const savedState =
                        await saveWorkspaceState(
                            body
                        )


                    sendJson(
                        response,
                        200,
                        savedState
                    )


                    return

                }


                /*
                 * =================================================
                 * UNKNOWN ROUTE
                 * =================================================
                 */

                sendJson(
                    response,
                    404,
                    {
                        error:
                            "Not found"
                    }
                )

            }
            catch (
                error
            ) {

                console.error(
                    "[WORKSPACE SERVER] Error:",
                    error
                )


                sendJson(
                    response,
                    500,
                    {
                        error:
                            error.message
                    }
                )

            }

        }
    )


/*
 * =========================================================
 * START SERVER
 * =========================================================
 */

server.listen(
    PORT,
    () => {

        console.log(
            `Workspace server running on http://localhost:${PORT}`
        )

        console.log(
            `Workspace data: ${DATA_FILE}`
        )

    }
)