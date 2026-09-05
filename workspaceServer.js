import http from "node:http"
import path from "node:path"

import * as googleDriveService
    from "./googleDriveService.js"

import * as authService
    from "./authService.js"

import * as requestService
    from "./electron/services/requestService.js"


import { createClient } from "@supabase/supabase-js"



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

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY."
  )
}

const supabaseServer = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)


const DATA_DIRECTORY =
    path.join(
        __dirname,
        ".api-tester-data"
    )


const WORKSPACE_DIRECTORY =
    path.join(
        DATA_DIRECTORY,
        "workspaces"
    )

/*
 * =========================================================
 * DEFAULT WORKSPACE STATE
 * =========================================================
 */

function createDefaultState() {

    return {

        version:
            1,

        revision:
            0,

        workspaces:
            [],

        activeWorkspaceId:
            null,

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

    await mkdir(
        WORKSPACE_DIRECTORY,
        {
            recursive: true
        }
    )

}


function getSessionToken(request) {

    const cookieHeader =
        request.headers?.cookie ||
        ""

    const cookies =
        cookieHeader
            .split(";")
            .map(
                cookie =>
                    cookie.trim()
            )
            .filter(Boolean)

    const sessionCookie =
        cookies.find(
            cookie =>
                cookie.startsWith(
                    "api_tester_session="
                )
        )

    if (!sessionCookie) {
        return null
    }

    return decodeURIComponent(
        sessionCookie.substring(
            "api_tester_session=".length
        )
    )
}


async function getAuthenticatedUser(request) {

    const token =
        getSessionToken(request)

    if (!token) {
        return null
    }

    const result =
        await authService.findSession(
            token
        )

    if (!result?.session) {
        return null
    }

    return result.session.userId
}


async function getSupabaseAuthenticatedUser(request) {
  const authorization = request.headers?.authorization

  if (!authorization) {
    return null
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    return null
  }

  const accessToken = match[1].trim()

  if (!accessToken) {
    return null
  }

  const {
    data: { user },
    error,
  } = await supabaseServer.auth.getUser(accessToken)

  if (error || !user) {
    return null
  }

  return user.id
}

function getUserWorkspaceFile(userId) {

    return path.join(
        WORKSPACE_DIRECTORY,
        `${userId}.json`
    )

}


/*
 * =========================================================
 * NORMALIZE STATE
 * =========================================================
 */

function normalizeState(state) {

    return {

        version:
            state?.version ??
            1,

        revision:
            Number.isInteger(
                state?.revision
            )
                ? state.revision
                : 0,

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

async function readWorkspaceState(
    userId
) {

        const dataFile =
        getUserWorkspaceFile(
            userId
        )

    await ensureDataDirectory()


    try {

        const content =
            await readFile(
                dataFile,
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
                    WORKSPACE_DIRECTORY,
                    `workspace-state-corrupt-${Date.now()}.json`
                )


            try {

                await copyFile(
                    dataFile,
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
                dataFile,
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
                dataFile,
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
    userId,
    state
) {

    const dataFile =
        getUserWorkspaceFile(
            userId
        )

    writeQueue =
        writeQueue.then(
            async () => {

                await ensureDataDirectory()

                const currentState =
                    await readWorkspaceState(
                        userId
                    )

                const currentRevision =
                    Number.isInteger(
                        currentState.revision
                    )
                        ? currentState.revision
                        : 0

                const nextState = {

                    version:
                        1,

                    revision:
                        currentRevision + 1,

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
                        new Date().toISOString()

                }

                const tempFile =
                    `${dataFile}.tmp`

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
                    dataFile
                )

                return nextState

            }
        )

    return writeQueue
}

async function writeWorkspaceStateDirectly(
    userId,
    state
) {

    const dataFile =
    getUserWorkspaceFile(
        userId
    )

    await ensureDataDirectory()


    const normalizedState =
        normalizeState(
            state
        )


    const tempFile =
        `${dataFile}.tmp`


    await writeFile(
        tempFile,
        JSON.stringify(
            normalizedState,
            null,
            2
        ),
        "utf8"
    )


    await rename(
        tempFile,
        dataFile
    )


    return normalizedState

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
        statusCode
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

                                const allowedOrigins = [
                    "http://localhost:5173",
                    "https://api-tester-jade.vercel.app"
                ]

                const origin =
                    request.headers?.origin

                if (
                    allowedOrigins.includes(origin)
                ) {
                    response.setHeader(
                        "Access-Control-Allow-Origin",
                        origin
                    )
                }

                response.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, OPTIONS"
                )

                response.setHeader(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Accept, Authorization"
                )

                response.setHeader(
                    "Access-Control-Allow-Credentials",
                    "true"
                )

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
        204
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
 * USER AUTH - REGISTER
 * =================================================
 */

if (
    request.url ===
    "/api/auth/register"
    &&
    request.method ===
    "POST"
) {

    try {

        const body =
            await readRequestBody(
                request
            )


        const name =
            String(
                body?.name ??
                ""
            )
                .trim()


        const email =
            String(
                body?.email ??
                ""
            )
                .trim()


        const password =
            String(
                body?.password ??
                ""
            )


        /*
         * -----------------------------------------
         * VALIDATION
         * -----------------------------------------
         */

        if (
            !name
        ) {

            sendJson(
                response,
                400,
                {
                    error:
                        "Name is required."
                }
            )

            return

        }


        if (
            !email
        ) {

            sendJson(
                response,
                400,
                {
                    error:
                        "Email is required."
                }
            )

            return

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {

            sendJson(
                response,
                400,
                {
                    error:
                        "Please enter a valid email address."
                }
            )

            return

        }


        if (
            password.length <
            8
        ) {

            sendJson(
                response,
                400,
                {
                    error:
                        "Password must be at least 8 characters long."
                }
            )

            return

        }


        /*
         * -----------------------------------------
         * CREATE USER
         * -----------------------------------------
         */

        const user =
            await authService.createUser({

                name,

                email,

                password

            })


        /*
         * -----------------------------------------
         * SUCCESS
         * -----------------------------------------
         */

        sendJson(
            response,
            201,
            {
                success:
                    true,

                user

            }
        )

    }
    catch (error) {

        console.error(
            "[AUTH] Registration failed:",
            error
        )


        const message =
            error?.message ||
            "Registration failed."


        const statusCode =
            message.includes(
                "already exists"
            )
                ? 409
                : 500


        sendJson(
            response,
            statusCode,
            {
                error:
                    message
            }
        )

    }


    return
}


/*
 * =================================================
 * USER AUTH - LOGIN
 * =================================================
 */

if (
    request.url ===
    "/api/auth/login"
    &&
    request.method ===
    "POST"
) {

    try {

        const body =
            await readRequestBody(
                request
            )


        const email =
            String(
                body?.email ??
                ""
            )
                .trim()
                .toLowerCase()


        const password =
            String(
                body?.password ??
                ""
            )


        /*
         * -----------------------------------------
         * VALIDATION
         * -----------------------------------------
         */

        if (
            !email ||
            !password
        ) {

            sendJson(
                response,
                400,
                {
                    error:
                        "Email and password are required."
                }
            )

            return

        }


        /*
         * -----------------------------------------
         * FIND USER
         * -----------------------------------------
         */

        const user =
            await authService.findUserByEmail(
                email
            )


        /*
         * Do not reveal whether the
         * email exists.
         */

        if (
            !user
        ) {

            sendJson(
                response,
                401,
                {
                    error:
                        "Invalid email or password."
                }
            )

            return

        }


        /*
         * -----------------------------------------
         * VERIFY PASSWORD
         * -----------------------------------------
         */

        const passwordValid =
            await authService.verifyPassword(

                password,

                user.passwordSalt,

                user.passwordHash

            )


        if (
            !passwordValid
        ) {

            sendJson(
                response,
                401,
                {
                    error:
                        "Invalid email or password."
                }
            )

            return

        }


        /*
         * -----------------------------------------
         * CREATE SESSION
         * -----------------------------------------
         */

        const session =
            await authService.createSession(
                user.id
            )


        /*
         * -----------------------------------------
         * HTTP-ONLY SESSION COOKIE
         * -----------------------------------------
         */

        response.setHeader(
            "Set-Cookie",

            `api_tester_session=${session.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(30 * 24 * 60 * 60)}`
        )


        /*
         * -----------------------------------------
         * SUCCESS
         * -----------------------------------------
         */

        sendJson(
            response,
            200,
            {

                success:
                    true,

                user:
                    authService.sanitizeUser(
                        user
                    )

            }
        )

    }
    catch (error) {

        console.error(
            "[AUTH] Login failed:",
            error
        )


        sendJson(
            response,
            500,
            {
                error:
                    "Login failed."
            }
        )

    }


    return
}



/*
 * =================================================
 * USER AUTH - LOGOUT
 * =================================================
 */

if (
    request.url ===
    "/api/auth/logout"
    &&
    request.method ===
    "POST"
) {

    try {

        const cookieHeader =
            request.headers.cookie ??
            ""


        const sessionCookie =
            cookieHeader
                .split(";")
                .map(
                    cookie =>
                        cookie.trim()
                )
                .find(
                    cookie =>
                        cookie.startsWith(
                            "api_tester_session="
                        )
                )


        const token =
            sessionCookie
                ? sessionCookie
                    .slice(
                        "api_tester_session=".length
                    )
                : null


        if (
            token
        ) {

            await authService.destroySession(
                token
            )

        }


        response.setHeader(
            "Set-Cookie",
            "api_tester_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
        )


        sendJson(
            response,
            200,
            {
                success:
                    true
            }
        )

    }
    catch (error) {

        console.error(
            "[AUTH] Logout failed:",
            error
        )


        sendJson(
            response,
            500,
            {
                error:
                    "Logout failed."
            }
        )

    }


    return
}


/*
 * =================================================
 * USER AUTH - CURRENT USER
 * =================================================
 */

if (
    request.url ===
    "/api/auth/me"
    &&
    request.method ===
    "GET"
) {

    try {

        const cookieHeader =
            request.headers.cookie ??
            ""


        const sessionCookie =
            cookieHeader
                .split(";")
                .map(
                    cookie =>
                        cookie.trim()
                )
                .find(
                    cookie =>
                        cookie.startsWith(
                            "api_tester_session="
                        )
                )


        const token =
            sessionCookie
                ? sessionCookie.slice(
                    "api_tester_session=".length
                )
                : null


        /*
         * -----------------------------------------
         * NO SESSION
         * -----------------------------------------
         */

        if (
            !token
        ) {

            sendJson(
                response,
                401,
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
         * -----------------------------------------
         * FIND SESSION
         * -----------------------------------------
         */

        const session =
            await authService.findSession(
                token
            )


        if (
            !session
        ) {

            sendJson(
                response,
                401,
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
         * -----------------------------------------
         * AUTHENTICATED
         * -----------------------------------------
         */

        sendJson(
            response,
            200,
            {
                authenticated:
                    true,

                user:
                    authService.sanitizeUser(
                        session.user
                    )
            }
        )

    }
    catch (error) {

        console.error(
            "[AUTH] Current-user check failed:",
            error
        )


        sendJson(
            response,
            500,
            {
                error:
                    "Failed to check authentication status."
            }
        )

    }


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

const userId = await getSupabaseAuthenticatedUser(request)

    if (!userId) {

        sendJson(
            response,
            401,
            {
                error:
                    "Authentication required."
            }
        )

        return
    }

    const state =
        await readWorkspaceState(
            userId
        )

    sendJson(
        response,
        200,
        state
    )

    return
}







                if (
    request.url ===
    "/api/workspace-state/apply-remote"
    &&
    request.method ===
    "POST"
) {

        const userId =
        await getAuthenticatedUser(
            request
        )

    if (!userId) {

        sendJson(
            response,
            401,
            {
                error:
                    "Authentication required."
            }
        )

        return
    }

    let body = ""

    request.on(
        "data",
        chunk => {
            body += chunk
        }
    )

    request.on(
        "end",
        async () => {

            try {

                const remoteState =
                    JSON.parse(body)


                const workspaces =
                    Array.isArray(
                        remoteState?.workspaces
                    )
                        ? remoteState.workspaces
                        : []


                const activeWorkspaceId =
                    remoteState?.activeWorkspaceId ??
                    workspaces[0]?.id ??
                    null


                const remoteRevision =
                    Number.isInteger(
                        remoteState?.revision
                    )
                        ? remoteState.revision
                        : 0


                const nextState = {

                    version:
                        remoteState?.version ??
                        1,

                    revision:
                        remoteRevision,

                    workspaces,

                    activeWorkspaceId,

                    updatedAt:
                        remoteState?.updatedAt ??
                        new Date().toISOString()

                }


await writeWorkspaceStateDirectly(
    userId,
    nextState
)


                sendJson(
                    response,
                    200,
                    nextState
                )

            }
            catch (error) {

                console.error(
                    "[WORKSPACE] Failed applying remote state:",
                    error
                )


                sendJson(
                    response,
                    500,
                    {
                        error:
                            error?.message ||
                            "Failed to apply remote workspace state"
                    }
                )

            }

        }
    )

    return
}


/*
 * =================================================
 * LOCAL REQUEST AGENT
 * =================================================
 */

if (
    request.url ===
    "/api/proxy/request"
    &&
    request.method ===
    "POST"
) {
const origin =
    request.headers?.origin

const allowedOrigins = [
    "http://localhost:5173",
    "https://api-tester-jade.vercel.app"
]

if (
    origin &&
    !allowedOrigins.includes(
        origin
    )
) {

    sendJson(
        response,
        403,
        {
            error:
                "Forbidden origin."
        }
    )

    return
}
    const userId =
        await getAuthenticatedUser(
            request
        )

    if (!userId) {
        sendJson(
            response,
            401,
            {
                error:
                    "Authentication required."
            }
        )

        return
    }

    const body =
        await readRequestBody(
            request
        )

    const method =
        String(
            body?.method ??
            "GET"
        ).toUpperCase()

    const url =
        String(
            body?.url ??
            ""
        ).trim()

    if (!url) {
        sendJson(
            response,
            400,
            {
                error:
                    "Request URL is required."
            }
        )

        return
    }

    let parsedUrl

    try {
        parsedUrl =
            new URL(
                url
            )
    } catch {
        sendJson(
            response,
            400,
            {
                error:
                    `Invalid request URL: ${url}`
            }
        )

        return
    }

    if (
        ![
            "http:",
            "https:"
        ].includes(
            parsedUrl.protocol
        )
    ) {
        sendJson(
            response,
            400,
            {
                error:
                    "Only HTTP and HTTPS URLs are supported."
            }
        )

        return
    }

    if (
        ![
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        ].includes(
            method
        )
    ) {
        sendJson(
            response,
            400,
            {
                error:
                    `Unsupported HTTP method: ${method}`
            }
        )

        return
    }

    const result = await requestService.execute({
    ...body,
    method,
    url,
})

    sendJson(
        response,
        200,
        result
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

const userId =
    await getSupabaseAuthenticatedUser(
        request
    )

    if (!userId) {

        sendJson(
            response,
            401,
            {
                error:
                    "Authentication required."
            }
        )

        return
    }

    const body =
        await readRequestBody(
            request
        )

    const savedState =
        await saveWorkspaceState(
            userId,
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

server.listen(PORT, "localhost", () => {

        console.log(
            `Workspace server running on http://localhost:${PORT}`
        )

console.log(
    `Workspace data directory: ${WORKSPACE_DIRECTORY}`
)

    }
)   