import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { fileURLToPath } from "node:url";

import { google } from "googleapis";
import { Readable } from "node:stream";



const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


const PROJECT_ROOT =
    __dirname;


const CREDENTIALS_PATH =
    path.join(
        PROJECT_ROOT,
        "google-web-credentials.json"
    );


const DATA_DIRECTORY =
    path.join(
        PROJECT_ROOT,
        ".api-tester-data"
    );


const TOKEN_FILE =
    path.join(
        DATA_DIRECTORY,
        "google-token.json"
    );


const DRIVE_STATE_FILE =
    path.join(
        DATA_DIRECTORY,
        "google-drive-state.json"
    );


const DRIVE_FOLDER_NAME =
    "API Tester";


const WORKSPACE_FILE_NAME =
    "workspaces.json";


const FOLDER_MIME_TYPE =
    "application/vnd.google-apps.folder";

const SCOPES = [
    "https://www.googleapis.com/auth/drive.file"
];


const REDIRECT_URI =
    "http://localhost:3001/oauth2callback";


let oauthClient = null;


let pendingOAuthState = null;



/*
 * OAuth state is kept in memory.
 *
 * Because this is currently a local single-user
 * development server, this is sufficient for the
 * first implementation.
 */



function generateState() {

    return crypto.randomBytes(
        32
    ).toString(
        "hex"
    );

}


async function ensureDataDirectory() {

    await fs.mkdir(
        DATA_DIRECTORY,
        {
            recursive: true
        }
    );

}


async function loadCredentials() {

    const content =
        await fs.readFile(
            CREDENTIALS_PATH,
            "utf8"
        );


    const credentials =
        JSON.parse(
            content
        );


    const config =
        credentials.web ??
        credentials.installed;


    if (!config) {

        throw new Error(
            "google-web-credentials.json does not contain a web or installed OAuth client."
        );

    }


    return config;

}


async function getOAuthClient() {

    if (oauthClient) {

        return oauthClient;

    }


    const config =
        await loadCredentials();


    oauthClient =
        new google.auth.OAuth2(

            config.client_id,

            config.client_secret,

            REDIRECT_URI

        );


    return oauthClient;

}


async function loadSavedToken() {

    await ensureDataDirectory();


    try {

        const content =
            await fs.readFile(
                TOKEN_FILE,
                "utf8"
            );


        return JSON.parse(
            content
        );

    }
    catch (error) {

        if (
            error.code === "ENOENT"
        ) {

            return null;

        }


        throw error;

    }

}


async function saveToken(tokens) {

    await ensureDataDirectory();


    await fs.writeFile(
        TOKEN_FILE,
        JSON.stringify(
            tokens,
            null,
            2
        ),
        "utf8"
    );

}



async function loadDriveState() {

    await ensureDataDirectory();

    try {

        const content =
            await fs.readFile(
                DRIVE_STATE_FILE,
                "utf8"
            );

        return JSON.parse(
            content
        );

    }
    catch (error) {

        if (
            error.code === "ENOENT"
        ) {

            return {};

        }

        throw error;

    }

}


async function saveDriveState(
    state
) {

    await ensureDataDirectory();

    await fs.writeFile(
        DRIVE_STATE_FILE,
        JSON.stringify(
            state,
            null,
            2
        ),
        "utf8"
    );

}


export async function getAuthorizationUrl() {

    const client =
        await getOAuthClient();


    const state =
        generateState();


    pendingOAuthState =
        state;


    return client.generateAuthUrl({

        access_type:
            "offline",

        include_granted_scopes:
            true,

        scope:
            SCOPES,

        state,

        prompt:
            "consent"

    });

}


export async function handleOAuthCallback(
    query
) {

    const {
        code,
        state,
        error
    } = query;


    if (error) {

        throw new Error(
            `Google authorization failed: ${error}`
        );

    }


    if (!state || state !== pendingOAuthState) {

        throw new Error(
            "Invalid OAuth state."
        );

    }


    pendingOAuthState =
        null;


    if (!code) {

        throw new Error(
            "Google did not return an authorization code."
        );

    }


    const client =
        await getOAuthClient();


    const {
        tokens
    } =
        await client.getToken(
            code
        );


    client.setCredentials(
        tokens
    );


    await saveToken(
        tokens
    );


    return {

        authenticated: true

    };

}


export async function getAuthenticatedClient() {

    const token =
        await loadSavedToken();


    if (!token) {

        return null;

    }


    const client =
        await getOAuthClient();


    client.setCredentials(
        token
    );


    try {

        await client.getAccessToken();

        return client;

    }
    catch (error) {

        console.error(
            "[GOOGLE] Saved token is no longer usable:",
            error
        );


        return null;

    }

}



async function getDriveClient() {

    const client =
        await getAuthenticatedClient();


    if (!client) {

        throw new Error(
            "Google Drive is not connected."
        );

    }


    return google.drive({

        version: "v3",

        auth: client

    });

}


export async function getAuthStatus() {

    const client =
        await getAuthenticatedClient();


    if (!client) {

        return {

            authenticated: false,

            user: null

        };

    }


    const drive =
        google.drive({

            version: "v3",

            auth: client

        });


    const about =
        await drive.about.get({

            fields:
                "user(displayName,emailAddress,photoLink)"

        });


    return {

        authenticated: true,

        user:
            about.data.user ??
            null

    };

}




async function findOrCreateApiTesterFolder(
    drive
) {

    const state =
        await loadDriveState();


    /*
     * -----------------------------------------
     * Reuse cached folder ID
     * -----------------------------------------
     */

    if (state.folderId) {

        try {

            const existing =
                await drive.files.get({

                    fileId:
                        state.folderId,

                    fields:
                        "id,name,mimeType,trashed"

                });


            if (
                existing.data &&
                !existing.data.trashed
            ) {

                return existing.data.id;

            }

        }
        catch {

            console.log(
                "[GOOGLE] Cached API Tester folder is no longer available."
            );

        }

    }


    /*
     * -----------------------------------------
     * Search for existing folder
     * -----------------------------------------
     */

    const result =
        await drive.files.list({

            q:
                `name = '${DRIVE_FOLDER_NAME}' ` +
                `and mimeType = '${FOLDER_MIME_TYPE}' ` +
                `and trashed = false`,

            spaces:
                "drive",

            fields:
                "files(id,name,mimeType,modifiedTime)",

            pageSize:
                10

        });


    const existingFolder =
        result.data.files?.[0];


    if (existingFolder) {

        await saveDriveState({

            ...state,

            folderId:
                existingFolder.id

        });


        return existingFolder.id;

    }


    /*
     * -----------------------------------------
     * Create folder
     * -----------------------------------------
     */

    const created =
        await drive.files.create({

            requestBody: {

                name:
                    DRIVE_FOLDER_NAME,

                mimeType:
                    FOLDER_MIME_TYPE

            },

            fields:
                "id,name,mimeType"

        });


    const folderId =
        created.data.id;


    if (!folderId) {

        throw new Error(
            "Google Drive did not return the API Tester folder ID."
        );

    }


    await saveDriveState({

        ...state,

        folderId

    });


    console.log(
        "[GOOGLE] Created API Tester folder."
    );


    return folderId;

}



async function findOrCreateWorkspaceFile(
    drive,
    folderId
) {

    const state =
        await loadDriveState();


    /*
     * =====================================================
     * 1. Try the cached workspace file ID first
     * =====================================================
     */

    if (
        state.workspaceFileId
    ) {

        try {

            const existing =
                await drive.files.get({

                    fileId:
                        state.workspaceFileId,

                    fields:
                        "id,name,mimeType,trashed,modifiedTime"

                });


            if (
                existing.data &&
                !existing.data.trashed
            ) {

                return existing.data;

            }

        }
        catch {

            console.log(
                "[GOOGLE] Cached workspaces.json ID is no longer available. Searching again."
            );

        }

    }


    /*
     * =====================================================
     * 2. Search inside the API Tester folder
     * =====================================================
     */

    const result =
        await drive.files.list({

            q:
                `'${folderId}' in parents ` +
                `and name = '${WORKSPACE_FILE_NAME}' ` +
                `and trashed = false`,

            spaces:
                "drive",

            fields:
                "files(id,name,mimeType,modifiedTime)",

            pageSize:
                10

        });


    const existingFile =
        result.data.files?.[0];


    /*
     * =====================================================
     * 3. File already exists
     * =====================================================
     */

    if (existingFile) {

        await saveDriveState({

            ...state,

            folderId,

            workspaceFileId:
                existingFile.id

        });


        return existingFile;

    }


    /*
     * =====================================================
     * 4. File does not exist
     *    Create initial workspaces.json
     * =====================================================
     */

    const initialData = {

        version:
            1,

        workspaces: [],

        activeWorkspaceId:
            null,

        updatedAt:
            new Date().toISOString()

    };


    const content =
        JSON.stringify(
            initialData,
            null,
            2
        );


    const created =
        await drive.files.create({

            requestBody: {

                name:
                    WORKSPACE_FILE_NAME,

                parents:
                    [
                        folderId
                    ],

                mimeType:
                    "application/json"

            },

            media: {

                mimeType:
                    "application/json",

                body:
                    Readable.from(
                        [
                            content
                        ]
                    )

            },

            fields:
                "id,name,mimeType,modifiedTime"

        });


    if (
        !created.data.id
    ) {

        throw new Error(
            "Google Drive did not return the workspace file ID."
        );

    }


    /*
     * =====================================================
     * 5. Remember the Drive file ID locally
     * =====================================================
     */

    await saveDriveState({

        ...state,

        folderId,

        workspaceFileId:
            created.data.id

    });


    console.log(
        "[GOOGLE] Created workspaces.json."
    );


    return created.data;

}



export async function ensureDriveWorkspace() {

    const drive =
        await getDriveClient();


    /*
     * Find or create:
     *
     * My Drive
     * └── API Tester
     */

    const folderId =
        await findOrCreateApiTesterFolder(
            drive
        );


    /*
     * Find or create:
     *
     * API Tester
     * └── workspaces.json
     */

    const workspaceFile =
        await findOrCreateWorkspaceFile(
            drive,
            folderId
        );


    return {

        success:
            true,

        folderId,

        workspaceFileId:
            workspaceFile.id,

        fileName:
            workspaceFile.name

    };

}


export async function uploadWorkspaceState(
    state
) {

    const drive =
        await getDriveClient();


    /*
     * Make sure:
     *
     * API Tester folder
     * workspaces.json
     *
     * both exist.
     */

    const workspace =
        await ensureDriveWorkspace();


    const content =
        JSON.stringify(
            {

                version:
                    1,

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

            },
            null,
            2
        );


    /*
     * Replace the contents of the existing
     * workspaces.json file.
     */

    const updated =
        await drive.files.update({

            fileId:
                workspace.workspaceFileId,

            media: {

                mimeType:
                    "application/json",

                body:
                    Readable.from(
                        [
                            content
                        ]
                    )

            },

            fields:
                "id,name,mimeType,modifiedTime"

        });


    return {

        success:
            true,

        fileId:
            updated.data.id,

        fileName:
            updated.data.name,

        modifiedTime:
            updated.data.modifiedTime

    };

}


async function streamToString(
    stream
) {

    const chunks = [];


    for await (
        const chunk of stream
    ) {

        chunks.push(

            Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk)

        );

    }


    return Buffer
        .concat(
            chunks
        )
        .toString(
            "utf8"
        );

}


export async function downloadWorkspaceState() {

    const drive =
        await getDriveClient();


    /*
     * Make sure API Tester/workspaces.json exists.
     */

    const workspace =
        await ensureDriveWorkspace();


    /*
     * Download the actual contents.
     */

    const response =
        await drive.files.get(

            {

                fileId:
                    workspace.workspaceFileId,

                alt:
                    "media"

            },

            {

                responseType:
                    "stream"

            }

        );


    const content =
        await streamToString(
            response.data
        );


    let parsed;

    try {

        parsed =
            JSON.parse(
                content
            );

    }
    catch {

        throw new Error(
            "The Google Drive workspaces.json file contains invalid JSON."
        );

    }


    return parsed;

}

export async function signOut() {

    try {

        await fs.unlink(
            TOKEN_FILE
        );

    }
    catch (error) {

        if (
            error.code !== "ENOENT"
        ) {

            throw error;

        }

    }


    oauthClient =
        null;


    pendingOAuthState =
        null;


    return true;

}