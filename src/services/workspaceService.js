import { supabase } from "../lib/supabase"

const isElectron =
    typeof window !== "undefined" &&
    Boolean(window.apiTester)





    const GOOGLE_AUTH_STATUS_URL =
    "http://localhost:3001/api/google/auth/status"





const GOOGLE_DRIVE_UPLOAD_URL =
    "http://localhost:3001/api/google/drive/upload"

const GOOGLE_DRIVE_DOWNLOAD_URL =
    "http://localhost:3001/api/google/drive/download"







function createDefaultWorkspace() {

    return {

        id:
            crypto.randomUUID(),

        name:
            "Default Workspace",

        collections: [],

        environments: [],

        selectedRequestId: null

    }

}


function normalizeWorkspace(workspace) {

    return {

        id:
            workspace.id ??
            crypto.randomUUID(),

        name:
            workspace.name ??
            "Unnamed Workspace",

        collections:
            Array.isArray(
                workspace.collections
            )
                ? workspace.collections
                : [],

        environments:
            Array.isArray(
                workspace.environments
            )
                ? workspace.environments
                : [],

        selectedRequestId:
            workspace.selectedRequestId ??
            null

    }

}


/*
 * =========================================================
 * COMMON WORKSPACE API
 * =========================================================
 *
 * Both Vite and Electron use the same API.
 *
 * Vite Browser
 *      │
 *      ├──────► localhost:3001
 *      │
 * Electron
 *      │
 *      └──────► localhost:3001
 *
 * The server owns the actual workspace data.
 * =========================================================
 */


async function fetchWorkspaceState() {
    const {
        data: {
            user
        },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) {
        console.error(
            "[SUPABASE] Failed to get authenticated user:",
            userError
        )

        throw userError
    }

    if (!user) {
        throw new Error(
            "Authentication required."
        )
    }

    const {
        data,
        error
    } = await supabase
        .from("workspace_states")
        .select(
            "version, revision, active_workspace_id, workspaces, updated_at"
        )
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle()

    if (error) {
        console.error(
            "[SUPABASE] Failed to load workspace:",
            error
        )

        throw error
    }

    if (!data) {
        return {
            version: 1,
            revision: 0,
            workspaces: [],
            activeWorkspaceId: null,
            updatedAt: null
        }
    }

    return {
        version:
            Number.isInteger(data.version)
                ? data.version
                : 1,

        revision:
            Number.isInteger(data.revision)
                ? data.revision
                : 0,

        workspaces:
            Array.isArray(data.workspaces)
                ? data.workspaces
                : [],

        activeWorkspaceId:
            data.active_workspace_id ??
            null,

        updatedAt:
            data.updated_at ??
            null
    }
}


async function saveWorkspaceState(state) {
    const {
        data: {
            user
        },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) {
        console.error(
            "[SUPABASE] Failed to get authenticated user:",
            userError
        )

        throw userError
    }

    if (!user) {
        throw new Error(
            "Authentication required."
        )
    }

    const {
        data: existingState,
        error: existingStateError
    } = await supabase
        .from("workspace_states")
        .select(
            "version, revision"
        )
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle()

    if (existingStateError) {
        console.error(
            "[SUPABASE] Failed to read workspace revision:",
            existingStateError
        )

        throw existingStateError
    }

    const currentRevision =
        Number.isInteger(
            existingState?.revision
        )
            ? existingState.revision
            : 0

    const normalizedWorkspaces =
        Array.isArray(
            state?.workspaces
        )
            ? state.workspaces.map(
                normalizeWorkspace
            )
            : []

    const nextState = {
        user_id:
            user.id,

        version:
            Number.isInteger(
                state?.version
            )
                ? state.version
                : 1,

        revision:
            currentRevision + 1,

        active_workspace_id:
            state?.activeWorkspaceId ??
            null,

        workspaces:
            normalizedWorkspaces,

        updated_at:
            new Date().toISOString()
    }

    const {
        data,
        error
    } = await supabase
        .from("workspace_states")
        .upsert(
            nextState,
            {
                onConflict:
                    "user_id"
            }
        )
        .select(
            "version, revision, active_workspace_id, workspaces, updated_at"
        )
        .single()

    if (error) {
        console.error(
            "[SUPABASE] Failed to save workspace:",
            error
        )

        throw error
    }

    return {
        version:
            data.version,

        revision:
            data.revision,

        workspaces:
            Array.isArray(
                data.workspaces
            )
                ? data.workspaces
                : [],

        activeWorkspaceId:
            data.active_workspace_id ??
            null,

        updatedAt:
            data.updated_at ??
            null
    }
}

async function getGoogleDriveAuthStatus() {

    if (isElectron) {
        return window.apiTester.googleAuthStatus()
    }

    const response =
        await fetch(
            GOOGLE_AUTH_STATUS_URL
        )

    if (!response.ok) {
        throw new Error(
            "Failed to check Google Drive authentication status"
        )
    }

    return response.json()
}


export async function getGoogleDriveStatus() {

    return getGoogleDriveAuthStatus()

}


export async function disconnectGoogleDrive() {

    if (isElectron) {
        return window.apiTester.googleSignOut()
    }

    const response =
        await fetch(
            "http://localhost:3001/api/google/auth/logout",
            {
                method:
                    "POST"
            }
        )

    if (!response.ok) {

        let message =
            "Failed to disconnect Google Drive"

        try {

            const error =
                await response.json()

            if (error?.error) {
                message =
                    error.error
            }

        }
        catch {
        }

        throw new Error(
            message
        )
    }

    return response.json()
}

async function uploadWorkspaceToGoogleDrive(
    state
) {

    const authStatus =
        await getGoogleDriveAuthStatus()


    /*
     * Google Drive is optional.
     *
     * If the user has not connected Google Drive,
     * local saving should still work normally.
     */

       if (
        !authStatus?.authenticated
    ) {

        return {
            synced:
                false,

            skipped:
                true,

            reason:
                "Google Drive is not connected."
        }
    }

    if (isElectron) {

        const result =
            await window.apiTester
                .googleUploadWorkspace(
                    state
                )

        return {
            synced:
                true,

            skipped:
                false,

            ...result
        }
    }

    const response =
        await fetch(
            GOOGLE_DRIVE_UPLOAD_URL,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        state
                    )
            }
        )

    if (!response.ok) {

        let message =
            "Failed to upload workspace to Google Drive"


        try {

            const error =
                await response.json()


            if (
                error?.error
            ) {

                message =
                    error.error

            }

        }
        catch {
        }


        throw new Error(
            message
        )

    }


    const result =
        await response.json()


    return {

        synced:
            true,

        skipped:
            false,

        ...result

    }

}

async function downloadWorkspaceFromGoogleDrive() {

    const authStatus =
        await getGoogleDriveAuthStatus()


    if (
        !authStatus?.authenticated
    ) {

        throw new Error(
            "Google Drive is not connected."
        )

    }

        if (isElectron) {
        return window.apiTester
            .googleDownloadWorkspace()
    }


    const response =
        await fetch(
            GOOGLE_DRIVE_DOWNLOAD_URL
        )


    if (!response.ok) {

        let message =
            "Failed to download workspace from Google Drive"


        try {

            const error =
                await response.json()


            if (
                error?.error
            ) {

                message =
                    error.error

            }

        }
        catch {
        }


        throw new Error(
            message
        )

    }


    const state =
        await response.json()


    return state

}

export async function loadWorkspaceFromGoogleDrive() {

    const driveState =
        await downloadWorkspaceFromGoogleDrive()


    const normalizedWorkspaces =
        Array.isArray(
            driveState?.workspaces
        )
            ? driveState.workspaces.map(
                normalizeWorkspace
            )
            : []


    const activeWorkspaceId =
        driveState?.activeWorkspaceId ??
        normalizedWorkspaces[0]?.id ??
        null


return {

    version:
        driveState?.version ??
        1,

    revision:
        Number.isInteger(
            driveState?.revision
        )
            ? driveState.revision
            : 0,

    workspaces:
        normalizedWorkspaces,

    activeWorkspaceId,

    updatedAt:
        driveState?.updatedAt ??
        null

}

}


export async function compareWorkspaceWithGoogleDrive(
    driveState = null
) {

    /*
     * -----------------------------------------
     * LOAD LOCAL STATE
     * -----------------------------------------
     */

    const localState =
        await fetchWorkspaceState()


    /*
     * -----------------------------------------
     * USE PROVIDED DRIVE STATE
     * OR DOWNLOAD IT
     * -----------------------------------------
     */

    const remoteState =
        driveState ??
        await loadWorkspaceFromGoogleDrive()


    /*
     * -----------------------------------------
     * NORMALIZE REVISIONS
     * -----------------------------------------
     */

    const localRevision =
        Number.isInteger(
            localState?.revision
        )
            ? localState.revision
            : 0


    const driveRevision =
        Number.isInteger(
            remoteState?.revision
        )
            ? remoteState.revision
            : 0


    /*
     * -----------------------------------------
     * COMPARE
     * -----------------------------------------
     */

    let status


    if (
        localRevision ===
        driveRevision
    ) {

        status =
            "SAME"

    }
    else if (
        localRevision >
        driveRevision
    ) {

        status =
            "LOCAL_NEWER"

    }
    else {

        status =
            "DRIVE_NEWER"

    }


    /*
     * -----------------------------------------
     * RETURN
     * -----------------------------------------
     */

    return {

        status,

        localRevision,

        driveRevision,

        localUpdatedAt:
            localState?.updatedAt ??
            null,

        driveUpdatedAt:
            remoteState?.updatedAt ??
            null,

        localWorkspaceCount:
            Array.isArray(
                localState?.workspaces
            )
                ? localState.workspaces.length
                : 0,

        driveWorkspaceCount:
            Array.isArray(
                remoteState?.workspaces
            )
                ? remoteState.workspaces.length
                : 0

    }

}


export async function syncWorkspaceFromGoogleDrive() {

    const driveState =
        await loadWorkspaceFromGoogleDrive()


    const workspaces =
        Array.isArray(
            driveState?.workspaces
        )
            ? driveState.workspaces
            : []


    if (
        workspaces.length === 0
    ) {

        return {

            synced:
                false,

            empty:
                true,

            version:
                driveState?.version ??
                1,

            revision:
                Number.isInteger(
                    driveState?.revision
                )
                    ? driveState.revision
                    : 0,

            workspaces:
                [],

            activeWorkspaceId:
                null,

            updatedAt:
                driveState?.updatedAt ??
                null

        }

    }


    const activeWorkspaceId =
        driveState.activeWorkspaceId ??
        workspaces[0]?.id ??
        null


await applyGoogleDriveWorkspaceLocally(
    workspaces,
    activeWorkspaceId,
    driveState.revision,
    driveState.version,
    driveState.updatedAt
)


    return {

        synced:
            true,

        empty:
            false,

        version:
            driveState?.version ??
            1,

        revision:
            Number.isInteger(
                driveState?.revision
            )
                ? driveState.revision
                : 0,

        workspaces,

        activeWorkspaceId,

        updatedAt:
            driveState?.updatedAt ??
            null

    }

}

export async function applyGoogleDriveWorkspaceLocally(
    workspaces,
    activeWorkspaceId,
    revision = 0,
    version = 1,
    updatedAt = null
) {

    const normalizedWorkspaces =
        Array.isArray(
            workspaces
        )
            ? workspaces.map(
                normalizeWorkspace
            )
            : []


    const nextActiveWorkspaceId =
        activeWorkspaceId ??
        normalizedWorkspaces[0]?.id ??
        null


   const response =
    await fetch(
        "http://localhost:3001/api/workspace-state/apply-remote",
        {

            method:
                "POST",

            credentials:
                "include",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body:
                JSON.stringify({

                    version,

                    revision,

                    workspaces:
                        normalizedWorkspaces,

                    activeWorkspaceId:
                        nextActiveWorkspaceId,

                    updatedAt

                })

        }
    )


    if (!response.ok) {

        let message =
            "Failed to apply Google Drive workspace locally"


        try {

            const error =
                await response.json()


            if (error?.error) {

                message =
                    error.error

            }

        }
        catch {
        }


        throw new Error(
            message
        )

    }


    return response.json()

}
/*
 * =========================================================
 * LEGACY DATA MIGRATION
 * =========================================================
 *
 * Used only when the common workspace storage
 * is empty.
 *
 * This allows old browser localStorage data
 * to be moved into the new common storage.
 * =========================================================
 */






/*
 * =========================================================
 * LOAD WORKSPACES
 * =========================================================
 */


export async function loadWorkspaces() {

    performance.mark?.(
        "api-tester:workspace-load-start"
    )


    const state =
        await fetchWorkspaceState()


    /*
     * =================================================
     * EXISTING USER WORKSPACE
     * =================================================
     */

    if (
        Array.isArray(
            state?.workspaces
        )
        &&
        state.workspaces.length > 0
    ) {

        const workspaces =
            state.workspaces.map(
                normalizeWorkspace
            )


        performance.mark?.(
            "api-tester:workspace-load-finished"
        )


        return workspaces
    }


    /*
     * =================================================
     * NEW USER
     * =================================================
     *
     * Do NOT load old localStorage data here.
     *
     * Every authenticated account gets
     * its own fresh workspace.
     */

    const freshWorkspace =
        createDefaultWorkspace()


    const workspaces =
        [
            freshWorkspace
        ]


    await saveWorkspaceState({

        workspaces,

        activeWorkspaceId:
            freshWorkspace.id

    })


    performance.mark?.(
        "api-tester:workspace-load-finished"
    )


    return workspaces

}

/*
 * =========================================================
 * SAVE WORKSPACES
 * =========================================================
 */


export async function saveWorkspaces(
    workspaces
) {

    performance.mark?.(
        "api-tester:workspace-save-start"
    )


    const currentState =
        await fetchWorkspaceState()


    const normalizedWorkspaces =
        Array.isArray(workspaces)
            ? workspaces.map(
                normalizeWorkspace
            )
            : []


    const stateToSave = {

        workspaces:
            normalizedWorkspaces,

        activeWorkspaceId:
            currentState.activeWorkspaceId ??
            null

    }



    const localState =
        await saveWorkspaceState(
            stateToSave
        )


    /*
     * =========================================
     * STEP 2 — GOOGLE DRIVE SYNC
     * =========================================
     *
     * Google Drive is optional.
     *
     * If the user hasn't connected Drive,
     * local saving succeeds and we return normally.
     *
     * If Drive is connected but upload fails,
     * we THROW the error.
     *
     * This is important because Ctrl+S should
     * only be considered completely successful
     * when both local and cloud saves succeed.
     */

    let googleDriveSync = {

        synced:
            false,

        skipped:
            true,

        reason:
            "Google Drive is not connected."

    }


    try {

        googleDriveSync =
            await uploadWorkspaceToGoogleDrive(
                localState
            )

    }
    catch (error) {

        console.error(
            "[GOOGLE DRIVE] Workspace upload failed:",
            error
        )


        throw new Error(
            `Local workspace was saved, but Google Drive sync failed: ${
                error?.message ||
                "Unknown error"
            }`
        )

    }


    performance.mark?.(
        "api-tester:workspace-save-finished"
    )


    return {

        localSaved:
            true,

        googleDrive:
            googleDriveSync

    }

}




/*
 * =========================================================
 * CREATE WORKSPACE
 * =========================================================
 */


export function createWorkspace(
    name
) {

    return {

        id:
            crypto.randomUUID(),

        name:
            name.trim() ||
            "New Workspace",

        collections: [],

        environments: [],

        selectedRequestId: null

    }

}


/*
 * =========================================================
 * ACTIVE WORKSPACE
 * =========================================================
 */

export async function saveActiveWorkspaceId(
    workspaceId
) {

    const state =
        await fetchWorkspaceState()


    await saveWorkspaceState({

        workspaces:
            state.workspaces,

        activeWorkspaceId:
            workspaceId ??
            null

    })

}


export async function loadActiveWorkspaceId() {

    const state =
        await fetchWorkspaceState()


    return (
        state.activeWorkspaceId ??
        null
    )

}



