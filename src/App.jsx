import { useEffect, useRef, useState } from 'react'
    import './styles/variables.css'
    import './styles/theme.css'
    import './styles/scrollbars.css'
    import './styles/layout.css'
    import AppLayout from './components/AppLayout'
    import Sidebar from './components/Sidebar'
    import Workspace from './components/Workspace'
    import EnvironmentPanel from './components/EnvironmentPanel'
    import { useCollections } from './hooks/useCollections'
    import { useHistory } from './hooks/useHistory'
    import { useRequest } from './hooks/useRequest'
    import Header from './components/Header'
    import SharedDialog from './components/SharedDialog'
    import {
        setActiveEnvironment,
        duplicateEnvironment,
        deleteEnvironment,
        renameEnvironment,
    } from './services/environmentService'
    import RunnerScreen from "./components/RunnerScreen";

import './styles/login.css'

import { supabase } from './lib/supabase'



import {
    loadWorkspaces,
    saveWorkspaces,
    createWorkspace,
    loadActiveWorkspaceId,
    loadWorkspaceFromGoogleDrive,
    applyGoogleDriveWorkspaceLocally,
    syncWorkspaceFromGoogleDrive,
    getGoogleDriveStatus,
    disconnectGoogleDrive,
    compareWorkspaceWithGoogleDrive,
    saveActiveWorkspaceId
} from './services/workspaceService'

    import { exportEnvironment as exportEnvironmentData, importEnvironmentFromFile } from './services/importExportService'
    import {
        forceCloseRuntimeWindow,
        onRuntimeMenuAction,
        onRuntimeRequestClose,
        pickTextFile,
        saveTextFile,
    } from './services/runtimeService'

import LoginScreen from './components/LoginScreen'
import HomePage from './components/HomePage'

import RegisterScreen from './components/RegisterScreen'


    function App() {


    const [authenticatedUser, setAuthenticatedUser] =
    useState(null)

const [showRegisterScreen, setShowRegisterScreen] =
    useState(false)

const [showHomePage, setShowHomePage] =
    useState(true)

    const [isAuthChecking, setIsAuthChecking] =
        useState(true)

        useEffect(() => {

        let cancelled = false


async function checkAuthentication() {

    try {

const { data, error } =
    await supabase.auth.getSession()

if (error) {
    throw error
}

if (cancelled) {
    return
}

const user =
    data?.session?.user

if (!user) {
    setAuthenticatedUser(null)
    return
}

const appUser = {
    id: user.id,
    email: user.email,
    name:
        user.user_metadata?.name ||
        user.email
}

console.log(
    "[AUTH] Supabase session found:",
    appUser
)

setAuthenticatedUser(
    appUser
)

    }
    catch (error) {

        console.error(
            "[AUTH] Failed checking session:",
            error
        )

    }
    finally {

        if (
            !cancelled
        ) {

            setIsAuthChecking(
                false
            )

        }

    }

}
        checkAuthentication()


        return () => {

            cancelled =
                true

        }

    }, [])




useEffect(() => {

    const {
        data: {
            subscription
        }
    } = supabase.auth.onAuthStateChange(
        (_event, session) => {

            const user =
                session?.user

            if (!user) {
                setAuthenticatedUser(null)
                return
            }

            const appUser = {
                id: user.id,
                email: user.email,
                name:
                    user.user_metadata?.name ||
                    user.email
            }

            setAuthenticatedUser(
                appUser
            )
        }
    )

    return () => {
        subscription.unsubscribe()
    }

}, [])



function handleLogin(user) {

    setAuthenticatedUser(
        user
    )

}


async function handleLogout() {

    try {

        const {
            error
        } = await supabase.auth.signOut()

        if (error) {
            throw error
        }

        setAuthenticatedUser(null)

    }
    catch (error) {

        console.error(
            "[AUTH] Sign out failed:",
            error
        )

    }

}

    const [sidebarOpen, setSidebarOpen] =useState(true)

    const [environmentPanelOpen, setEnvironmentPanelOpen] = useState(true)

    const [historicalRequest, setHistoricalRequest] = useState(null)

    const toggleEnvironmentPanel = () => {
        setEnvironmentPanelOpen(prev => !prev)
    }

    const [dialogState, setDialogState] = useState({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], onConfirm: null, onCancel: null })


    const [closeRequested, setCloseRequested] =
        useState(false);

   





    const historyState = useHistory({ onShowDialog: setDialogState })

    




    
const [workspaces, setWorkspaces] =
    useState([])

const [activeWorkspaceId, setActiveWorkspaceId] =
    useState(null)

const [isWorkspacesLoaded, setIsWorkspacesLoaded] =
    useState(false)

const savedWorkspaceSnapshotRef =
    useRef(null)



const [googleDriveStatus, setGoogleDriveStatus] =
    useState({
        authenticated: false,
        user: null
    })


const [googleDriveSyncing, setGoogleDriveSyncing] =
    useState(false)



const [saveStatus, setSaveStatus] =
    useState({
        state: "idle",
        message: ""
    })


async function saveCurrentWorkspaceChanges() {

    if (!isWorkspacesLoaded) {
        return false
    }


    const currentSnapshot =
        JSON.stringify(workspaces)


    const savedSnapshot =
        savedWorkspaceSnapshotRef.current


    /*
     * Nothing changed.
     */

    if (
        currentSnapshot ===
        savedSnapshot
    ) {

        return true

    }


    setSaveStatus({
        state: "saving",
        message: "Saving..."
    })


    try {

        const result =
            await saveWorkspaces(
                workspaces
            )


        /*
         * Local save succeeded.
         */

        if (
            result?.localSaved
        ) {

            if (
                result?.googleDrive?.synced
            ) {

                setSaveStatus({

                    state:
                        "saved",

                    message:
                        "Saved and synced to Google Drive"

                })

            }
            else if (
                result?.googleDrive?.skipped
            ) {

                setSaveStatus({

                    state:
                        "saved-local",

                    message:
                        "Saved locally"

                })

            }
            else {

                setSaveStatus({

                    state:
                        "saved",

                    message:
                        "Saved"

                })

            }

        }


        /*
         * IMPORTANT:
         * Mark this exact state as successfully saved.
         */

        savedWorkspaceSnapshotRef.current =
            currentSnapshot


        return true

    }
    catch (error) {

        console.error(
            "[WORKSPACE] Save failed:",
            error
        )


        /*
         * Local may already have been saved while
         * Google Drive sync failed.
         */

        if (
            String(
                error?.message || ""
            ).includes(
                "Google Drive sync failed"
            )
        ) {

            setSaveStatus({

                state:
                    "cloud-error",

                message:
                    "Saved locally — Google Drive sync failed"

            })

        }
        else {

            setSaveStatus({

                state:
                    "error",

                message:
                    error?.message ||
                    "Save failed"

            })

        }


        return false

    }

}

useEffect(() => {

    function handleGlobalKeyDown(event) {

        const isSaveShortcut =
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key.toLowerCase() === "s"


        if (!isSaveShortcut) {
            return
        }


        event.preventDefault()
        event.stopPropagation()


        void saveCurrentWorkspaceChanges()

    }


    window.addEventListener(
        "keydown",
        handleGlobalKeyDown,
        true
    )


    return () => {

        window.removeEventListener(
            "keydown",
            handleGlobalKeyDown,
            true
        )

    }

}, [
    workspaces,
    isWorkspacesLoaded
])





/*
 * =========================================================
 * ASYNC WORKSPACE INITIALIZATION
 * =========================================================
 *
 * Both Vite and Electron now use the same workspace API.
 *
 * loadWorkspaces() and loadActiveWorkspaceId() are async,
 * so they must be loaded after the component mounts.
 * =========================================================
 */

useEffect(() => {

    if (
        !authenticatedUser?.id
    ) {
        return
    }

    let cancelled = false

    async function initializeWorkspaces() {

        try {

            /*
             * Load workspace only after
             * the application user is authenticated.
             */

            const loadedWorkspaces =
                await loadWorkspaces()

            const savedWorkspaceId =
                await loadActiveWorkspaceId()

            if (
                cancelled
            ) {
                return
            }

            const normalizedWorkspaces =
                Array.isArray(
                    loadedWorkspaces
                )
                    ? loadedWorkspaces
                    : []

            const savedWorkspaceExists =
                normalizedWorkspaces.some(
                    workspace =>
                        workspace.id ===
                        savedWorkspaceId
                )

            const initialActiveId =
                savedWorkspaceExists
                    ? savedWorkspaceId
                    : (
                        normalizedWorkspaces[0]?.id ??
                        null
                    )

            setWorkspaces(
                normalizedWorkspaces
            )

            setActiveWorkspaceId(
                initialActiveId
            )

            savedWorkspaceSnapshotRef.current =
                JSON.stringify(
                    normalizedWorkspaces
                )

            setIsWorkspacesLoaded(
                true
            )

            console.log(
                "[WORKSPACE] Loaded for user:",
                authenticatedUser.id
            )

        }
        catch (error) {

            console.error(
                "[WORKSPACE] Failed to initialize:",
                error
            )

            if (
                !cancelled
            ) {

                setWorkspaces([])

                setActiveWorkspaceId(
                    null
                )

                setIsWorkspacesLoaded(
                    false
                )
            }

        }

    }

    initializeWorkspaces()

    return () => {

        cancelled = true

    }

}, [
    authenticatedUser?.id
])

useEffect(() => {

    let cancelled = false


    async function loadGoogleDriveStatus() {

        try {

            const status =
                await getGoogleDriveStatus()


            if (cancelled) {
                return
            }


            setGoogleDriveStatus(
                status
            )

        }
        catch (error) {

            console.error(
                "[GOOGLE DRIVE] Failed to load status:",
                error
            )

        }

    }


    loadGoogleDriveStatus()


    return () => {

        cancelled = true

    }

}, [])


useEffect(() => {

    const params =
        new URLSearchParams(
            window.location.search
        )


    const googleDriveStatus =
        params.get(
            "googleDrive"
        )


    if (
        googleDriveStatus !==
        "connected"
    ) {

        return

    }


    async function handleGoogleDriveConnected() {

        try {

console.log(
    "[GOOGLE DRIVE] Authentication successful."
)


const status =
    await getGoogleDriveStatus()


setGoogleDriveStatus(
    status
)


const remoteState =
    await loadWorkspaceFromGoogleDrive()


            const remoteWorkspaces =
                Array.isArray(
                    remoteState?.workspaces
                )
                    ? remoteState.workspaces
                    : []




                    const comparison =
    await compareWorkspaceWithGoogleDrive(
        remoteState
    )


console.log(
    "[GOOGLE DRIVE] Workspace comparison:",
    comparison
)
            /*
             * -----------------------------------------
             * DRIVE IS EMPTY
             * -----------------------------------------
             */

            if (
                remoteWorkspaces.length === 0
            ) {

                console.log(
                    "[GOOGLE DRIVE] Drive workspace is empty."
                )


                setDialogState({

                    open: true,

                    type: "choice",

                    title:
                        "Google Drive workspace is empty",

                    message:
                        "There is no workspace data in Google Drive. Save your current local workspace to Google Drive?",

                    initialValue:
                        "upload",

                    options: [

                        {
                            label:
                                "Save Local Data to Google Drive",

                            value:
                                "upload"

                        },

                        {
                            label:
                                "Cancel",

                            value:
                                "cancel"

                        }

                    ],

                    confirmLabel:
                        "Continue",

                    cancelLabel:
                        "Cancel",

                    onConfirm:
                        async (choice) => {

                            setDialogState(
                                current => ({
                                    ...current,
                                    open: false
                                })
                            )


                            if (
                                choice !==
                                "upload"
                            ) {

                                return

                            }


                            try {

                                await saveWorkspaces(
                                    workspaces
                                )


                                savedWorkspaceSnapshotRef.current =
                                    JSON.stringify(
                                        workspaces
                                    )


                                console.log(
                                    "[GOOGLE DRIVE] Local workspace uploaded."
                                )

                            }
                            catch (error) {

                                console.error(
                                    "[GOOGLE DRIVE] Initial upload failed:",
                                    error
                                )

                            }

                        }

                })


                return

            }


            /*
             * -----------------------------------------
             * DRIVE HAS DATA
             * -----------------------------------------
             * 
             */

            if (
    comparison.status ===
    "SAME"
) {

    console.log(
        "[GOOGLE DRIVE] Local and Drive revisions are identical:",
        comparison.localRevision
    )

    return
}



            setDialogState({

                open: true,

                type: "choice",

title:
    comparison.status === "LOCAL_NEWER"
        ? "Local Workspace Is Newer"
        : "Google Drive Workspace",

message:
    comparison.status === "LOCAL_NEWER"
        ? `Your local workspace is newer than Google Drive.

Local revision: ${comparison.localRevision}
Google Drive revision: ${comparison.driveRevision}

What would you like to do?`
        : `Google Drive contains a newer workspace.

Local revision: ${comparison.localRevision}
Google Drive revision: ${comparison.driveRevision}

What would you like to do?`,

                initialValue:
                    "drive",

options: [

    {
        label:
            comparison.status === "LOCAL_NEWER"
                ? "Keep Local Data and Upload to Google Drive"
                : "Use Google Drive Data",

        value:
            comparison.status === "LOCAL_NEWER"
                ? "local"
                : "drive"
    },

    {
        label:
            comparison.status === "LOCAL_NEWER"
                ? "Use Google Drive Data"
                : "Keep Local Data and Upload to Google Drive",

        value:
            comparison.status === "LOCAL_NEWER"
                ? "drive"
                : "local"
    }

],

                confirmLabel:
                    "Continue",

                cancelLabel:
                    "Cancel",

                onConfirm:
                    async (choice) => {

                        setDialogState(
                            current => ({
                                ...current,
                                open: false
                            })
                        )


                        /*
                         * =================================
                         * USE GOOGLE DRIVE
                         * =================================
                         */

if (
    choice ===
    "drive"
) {

    const remoteWorkspaces =
        Array.isArray(
            remoteState.workspaces
        )
            ? remoteState.workspaces
            : []




    

    const activeId =
        remoteState.activeWorkspaceId ??
        remoteWorkspaces[0]?.id ??
        null


    /*
     * First save Drive data into the common
     * local workspace server.
     *
     * This does NOT upload back to Drive.
     */

    await applyGoogleDriveWorkspaceLocally(
        remoteWorkspaces,
        activeId
    )


    /*
     * Then update the React UI.
     */

    setWorkspaces(
        remoteWorkspaces
    )


    setActiveWorkspaceId(
        activeId
    )


    /*
     * Drive data is now the current saved state.
     */

    savedWorkspaceSnapshotRef.current =
        JSON.stringify(
            remoteWorkspaces
        )


    console.log(
        "[GOOGLE DRIVE] Drive workspace selected and saved locally."
    )


    return

}

                        /*
                         * =================================
                         * KEEP LOCAL
                         * =================================
                         */

                        if (
                            choice ===
                            "local"
                        ) {

                            try {

                                await saveWorkspaces(
                                    workspaces
                                )


                                savedWorkspaceSnapshotRef.current =
                                    JSON.stringify(
                                        workspaces
                                    )


                                console.log(
                                    "[GOOGLE DRIVE] Local workspace uploaded."
                                )

                            }
                            catch (error) {

                                console.error(
                                    "[GOOGLE DRIVE] Failed uploading local workspace:",
                                    error
                                )

                            }

                        }

                    }

            })

        }
        catch (error) {

            console.error(
                "[GOOGLE DRIVE] Connection/sync failed:",
                error
            )

        }
        finally {

            /*
             * Remove the OAuth query parameter.
             */

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            )

        }

    }


    handleGoogleDriveConnected()

}, [
    isWorkspacesLoaded
])



    useEffect(() => {

    if (
        savedWorkspaceSnapshotRef.current === null
    ) {

        savedWorkspaceSnapshotRef.current =
            JSON.stringify(workspaces)

    }

}, [workspaces])



useEffect(() => {

    const removeCloseListener =
        onRuntimeRequestClose(() => {

            const currentSnapshot =
                JSON.stringify(workspaces)

            const savedSnapshot =
                savedWorkspaceSnapshotRef.current

            const hasUnsavedChanges =
                currentSnapshot !== savedSnapshot

            if (hasUnsavedChanges) {

                setCloseRequested(true)

                return
            }

            forceCloseRuntimeWindow()

        })

    return () => {

        if (removeCloseListener) {
            removeCloseListener()
        }

    }

}, [workspaces])





    const activeWorkspace =
        workspaces.find(
            workspace =>
            workspace.id === activeWorkspaceId
        )

    const environments =
        activeWorkspace?.environments ?? []


    const [runnerState, setRunnerState] = useState({
    open: false,
    nodeId: null,
    nodeType: null,
    collectionId: null,
    })



    function handleRunNode(
    collectionId,
    nodeId
    ) {
    const collection =
        collectionState.collections.find(
        (item) =>
            item.id === collectionId
        )

    if (!collection) {
        return
    }

    const findNodeType = (node) => {
        if (!node) {
        return null
        }

        if (node.id === nodeId) {
        return node.type
        }

        if (
        Array.isArray(node.children)
        ) {
        for (const child of node.children) {
            const result =
            findNodeType(child)

            if (result) {
            return result
            }
        }
        }

        return null
    }

    setRunnerState({
        open: true,
        collectionId,
        nodeId,
        nodeType:
        findNodeType(collection, nodeId),
    })
    }


async function handleWorkspaceChange(
    workspace
) {

    if (!workspace) {
        return
    }


    setActiveWorkspaceId(
        workspace.id
    )


    try {

        await saveActiveWorkspaceId(
            workspace.id
        )

    }
    catch (error) {

        console.error(
            "[WORKSPACE] Failed to save active workspace:",
            error
        )

    }

}




function handleCreateWorkspace() {

    setDialogState({

        open: true,

        type: "input",

        title: "New Workspace",

        message:
            "Enter a name for the new workspace.",

        initialValue: "",

        options: [],

        confirmLabel: "Create",

        cancelLabel: "Cancel",


        onConfirm:
            async (workspaceName) => {

                const name =
                    String(
                        workspaceName || ""
                    ).trim()


                if (!name) {
                    return
                }


                const newWorkspace = {

                    id:
                        crypto.randomUUID(),

                    name,

                    collections: [],

                    environments: [],

                    selectedRequestId:
                        null

                }


                const updated = [

                    ...workspaces,

                    newWorkspace

                ]


                /*
                 * Update UI immediately.
                 *
                 * The debounced save effect will
                 * persist the workspace.
                 */

                setWorkspaces(
                    updated
                )


                /*
                 * Make the new workspace active.
                 */

                setActiveWorkspaceId(
                    newWorkspace.id
                )


                /*
                 * Persist active workspace ID
                 * through the common backend.
                 */

                try {

                    await saveActiveWorkspaceId(
                        newWorkspace.id
                    )

                }
                catch (error) {

                    console.error(
                        "[WORKSPACE] Failed to save new active workspace:",
                        error
                    )

                }


                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                )

            },


        onCancel:
            () =>
                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                )

    })

}


function handleRenameWorkspace() {

    const currentWorkspace =
        activeWorkspace


    if (!currentWorkspace) {
        return
    }


    setDialogState({

        open: true,

        type: "input",

        title: "Rename Workspace",

        message:
            "Enter a new name for the workspace.",

        initialValue:
            currentWorkspace.name,

        options: [],

        confirmLabel: "Rename",

        cancelLabel: "Cancel",


        onConfirm:
            (newName) => {

                const name =
                    String(
                        newName || ""
                    ).trim()


                if (!name) {
                    return
                }


                const updated =
                    workspaces.map(
                        workspace =>

                            workspace.id ===
                            currentWorkspace.id

                                ? {
                                    ...workspace,
                                    name
                                }

                                : workspace
                    )


                /*
                 * Only update React state.
                 *
                 * Debounced save effect persists it.
                 */

                setWorkspaces(
                    updated
                )


                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                )

            },


        onCancel:
            () =>
                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                )

    })

}


function handleDeleteWorkspace() {

    const currentWorkspace =
        activeWorkspace


    if (!currentWorkspace) {
        return
    }


    if (workspaces.length <= 1) {
        return
    }


    setDialogState({

        open: true,

        type: "input",

        title: "Delete Workspace",

        message:
            `Delete workspace "${currentWorkspace.name}"? Type DELETE to confirm.`,

        initialValue: "",

        options: [],

        confirmLabel: "Delete",

        cancelLabel: "Cancel",


        onConfirm:
            async (value) => {

                if (
                    String(value || "")
                        .trim() !==
                    "DELETE"
                ) {

                    return

                }


                const updated =
                    workspaces.filter(
                        workspace =>
                            workspace.id !==
                            currentWorkspace.id
                    )


                if (
                    updated.length === 0
                ) {

                    return

                }


                const nextWorkspace =
                    updated[0]


                /*
                 * Update UI.
                 */

                setWorkspaces(
                    updated
                )


                /*
                 * Switch active workspace.
                 */

                setActiveWorkspaceId(
                    nextWorkspace.id
                )


                /*
                 * Persist active workspace
                 * through common backend.
                 */

                try {

                    await saveActiveWorkspaceId(
                        nextWorkspace.id
                    )

                }
                catch (error) {

                    console.error(
                        "[WORKSPACE] Failed to save active workspace after delete:",
                        error
                    )

                }


                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                )

            },


        onCancel:
            () =>
                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                )

    })

}


async function handleImportWorkspace() {

    try {

        const input =
            document.createElement(
                "input"
            )

        input.type =
            "file"

        input.accept =
            ".json,application/json"


        input.onchange =
            async (event) => {

                const file =
                    event.target.files?.[0]

                if (!file) {
                    return
                }


                try {

                    const text =
                        await file.text()


                    const importedData =
                        JSON.parse(
                            text
                        )


                    /*
                     * -----------------------------------------
                     * ACCEPT BOTH FORMATS
                     * -----------------------------------------
                     *
                     * 1. Single workspace:
                     *
                     * {
                     *     id,
                     *     name,
                     *     collections,
                     *     environments
                     * }
                     *
                     * 2. Complete workspace export:
                     *
                     * {
                     *     version,
                     *     workspaces,
                     *     activeWorkspaceId
                     * }
                     */

                    let importedWorkspaces = []


                    let importedActiveWorkspaceId =
                        null


                    if (
                        Array.isArray(
                            importedData?.workspaces
                        )
                    ) {

                        importedWorkspaces =
                            importedData.workspaces

                        importedActiveWorkspaceId =
                            importedData.activeWorkspaceId ??
                            importedWorkspaces[0]?.id ??
                            null

                    }
                    else if (
                        importedData &&
                        typeof importedData ===
                            "object"
                    ) {

                        importedWorkspaces =
                            [
                                importedData
                            ]

                        importedActiveWorkspaceId =
                            importedData.id ??
                            null

                    }
                    else {

                        throw new Error(
                            "Invalid workspace JSON format."
                        )

                    }


                    if (
                        importedWorkspaces.length ===
                        0
                    ) {

                        throw new Error(
                            "The selected file contains no workspace data."
                        )

                    }


                    /*
                     * -----------------------------------------
                     * NORMALIZE WORKSPACES
                     * -----------------------------------------
                     */

                    const normalizedWorkspaces =
                        importedWorkspaces.map(
                            workspace => ({

                                id:
                                    workspace?.id ??
                                    crypto.randomUUID(),

                                name:
                                    String(
                                        workspace?.name ??
                                        "Imported Workspace"
                                    ).trim() ||
                                    "Imported Workspace",

                                collections:
                                    Array.isArray(
                                        workspace?.collections
                                    )
                                        ? workspace.collections
                                        : [],

                                environments:
                                    Array.isArray(
                                        workspace?.environments
                                    )
                                        ? workspace.environments
                                        : [],

                                selectedRequestId:
                                    workspace?.selectedRequestId ??
                                    null

                            })
                        )


                    /*
                     * -----------------------------------------
                     * ASK HOW TO IMPORT
                     * -----------------------------------------
                     */

                    setDialogState({

                        open:
                            true,

                        type:
                            "choice",

                        title:
                            "Import Workspace",

                        message:
                            importedWorkspaces.length === 1
                                ? `Import workspace "${normalizedWorkspaces[0].name}"?`
                                : `Import ${normalizedWorkspaces.length} workspaces?`,

                        initialValue:
                            "add",

                        options: [

                            {
                                label:
                                    "Add to Current Workspaces",

                                value:
                                    "add"
                            },

                            {
                                label:
                                    "Replace Current Workspaces",

                                value:
                                    "replace"
                            }

                        ],

                        confirmLabel:
                            "Import",

                        cancelLabel:
                            "Cancel",


                        onConfirm:
                            async (mode) => {

                                setDialogState(
                                    current => ({
                                        ...current,
                                        open: false
                                    })
                                )


                                try {

                                    let nextWorkspaces


                                    let nextActiveWorkspaceId


                                    if (
                                        mode ===
                                        "replace"
                                    ) {

                                        nextWorkspaces =
                                            normalizedWorkspaces

                                        nextActiveWorkspaceId =
                                            importedActiveWorkspaceId ??
                                            normalizedWorkspaces[0]?.id ??
                                            null

                                    }
                                    else {

                                        nextWorkspaces =
                                            [
                                                ...workspaces,
                                                ...normalizedWorkspaces
                                            ]

                                        nextActiveWorkspaceId =
                                            importedActiveWorkspaceId ??
                                            normalizedWorkspaces[0]?.id ??
                                            null

                                    }


                                    await saveWorkspaces(
                                        nextWorkspaces
                                    )


                                    setWorkspaces(
                                        nextWorkspaces
                                    )


                                    setActiveWorkspaceId(
                                        nextActiveWorkspaceId
                                    )


                                    savedWorkspaceSnapshotRef.current =
                                        JSON.stringify(
                                            nextWorkspaces
                                        )


                                    console.log(
                                        "[WORKSPACE] Workspace import completed."
                                    )

                                }
                                catch (error) {

                                    console.error(
                                        "[WORKSPACE] Import save failed:",
                                        error
                                    )


                                    setDialogState({

                                        open:
                                            true,

                                        type:
                                            "confirm",

                                        title:
                                            "Import failed",

                                        message:
                                            error?.message ||
                                            "Failed to save imported workspace.",

                                        initialValue:
                                            "",

                                        options:
                                            [],

                                        confirmLabel:
                                            "OK",

                                        cancelLabel:
                                            "",

                                        onConfirm:
                                            () =>
                                                setDialogState(
                                                    current => ({
                                                        ...current,
                                                        open: false
                                                    })
                                                ),

                                        onCancel:
                                            () =>
                                                setDialogState(
                                                    current => ({
                                                        ...current,
                                                        open: false
                                                    })
                                                )

                                    })

                                }

                            },


                        onCancel:
                            () =>
                                setDialogState(
                                    current => ({
                                        ...current,
                                        open: false
                                    })
                                )

                    })

                }
                catch (error) {

                    console.error(
                        "[WORKSPACE] Invalid import file:",
                        error
                    )


                    setDialogState({

                        open:
                            true,

                        type:
                            "confirm",

                        title:
                            "Import failed",

                        message:
                            error?.message ||
                            "Invalid workspace file.",

                        initialValue:
                            "",

                        options:
                            [],

                        confirmLabel:
                            "OK",

                        cancelLabel:
                            "",

                        onConfirm:
                            () =>
                                setDialogState(
                                    current => ({
                                        ...current,
                                        open: false
                                    })
                                ),

                        onCancel:
                            () =>
                                setDialogState(
                                    current => ({
                                        ...current,
                                        open: false
                                    })
                                )

                    })

                }

            }


        input.click()

    }
    catch (error) {

        console.error(
            "[WORKSPACE] Could not open import dialog:",
            error
        )

    }

}

    function handleExportWorkspace(){

        const data =
            JSON.stringify(
                activeWorkspace,
                null,
                2
            );


        const blob =
            new Blob(
                [data],
                {
                    type:"application/json"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const a =
            document.createElement("a");


        a.href=url;

        a.download=
            `${activeWorkspace.name}.json`;


        a.click();


        URL.revokeObjectURL(url);

    }











    const collections =
        activeWorkspace?.collections ?? []





    const collectionState =
        useCollections({

            workspaceId:
                activeWorkspace?.id,

            workspaceCollections:
                activeWorkspace?.collections || [],

            initialSelectedRequestId:
                activeWorkspace?.selectedRequestId ?? null,

            onSelectedRequestChange:
                handleSelectedRequestChange,

            onCollectionsChange:
                handleWorkspaceCollectionsChange,

            onShowDialog:
                setDialogState

        })


        function getChangedRequestItems() {

    const savedSnapshot =
        savedWorkspaceSnapshotRef.current

    if (!savedSnapshot) {
        return []
    }

    let savedWorkspaces

    try {

        savedWorkspaces =
            JSON.parse(savedSnapshot)

    } catch {

        return []
    }


    const savedRequests =
        new Map()


    function collectRequests(nodes) {

        if (!Array.isArray(nodes)) {
            return
        }

        for (const node of nodes) {

            if (!node) {
                continue
            }


            if (node.type === 'request') {

                savedRequests.set(
                    node.id,
                    JSON.stringify(node)
                )

            }


            if (Array.isArray(node.children)) {

                collectRequests(
                    node.children
                )

            }


            if (Array.isArray(node.requests)) {

                collectRequests(
                    node.requests
                )

            }


            if (Array.isArray(node.folders)) {

                collectRequests(
                    node.folders
                )

            }

        }
    }


    for (const workspace of savedWorkspaces) {

        collectRequests(
            workspace?.collections
        )

    }


    const changedRequests = []


    function compareRequests(nodes) {

        if (!Array.isArray(nodes)) {
            return
        }


        for (const node of nodes) {

            if (!node) {
                continue
            }


            if (node.type === 'request') {

                const currentJson =
                    JSON.stringify(node)

                const savedJson =
                    savedRequests.get(
                        node.id
                    )


                if (
                    savedJson === undefined ||
                    savedJson !== currentJson
                ) {

                    changedRequests.push({
                        id: node.id,
                        name:
                            node.name ??
                            'Unnamed Request'
                    })

                }

            }


            if (Array.isArray(node.children)) {

                compareRequests(
                    node.children
                )

            }


            if (Array.isArray(node.requests)) {

                compareRequests(
                    node.requests
                )

            }


            if (Array.isArray(node.folders)) {

                compareRequests(
                    node.folders
                )

            }

        }
    }


    for (const workspace of workspaces) {

        compareRequests(
            workspace?.collections
        )

    }


    return changedRequests
}


function handleWorkspaceCollectionsChange(
    collections
) {

    setWorkspaces(
        currentWorkspaces => {

            return currentWorkspaces.map(
                workspace => {

                    if (
                        workspace.id !==
                        activeWorkspaceId
                    ) {

                        return workspace

                    }


                    return {

                        ...workspace,

                        collections

                    }

                }
            )

        }
    )

}

function handleSelectedRequestChange(
    requestId
) {

    setWorkspaces(
        currentWorkspaces => {

            return currentWorkspaces.map(
                workspace => {

                    if (
                        workspace.id !==
                        activeWorkspaceId
                    ) {

                        return workspace

                    }


                    return {

                        ...workspace,

                        selectedRequestId:
                            requestId

                    }

                }
            )

        }
    )

}

    const activeEnvironment = environments.find((environment) => environment.active) ?? null

    function handleRequestSuccess({
        request,
        response,
        resolvedUrl,
    }) {

        
        
        
        
        

        historyState.addEntry({
            name:
            collectionState.selectedRequest?.name
            ?? request?.name
            ?? 'Unnamed Request',

            method:
                request?.method
                ?? 'GET',

            url:
                request?.url
                ?? resolvedUrl
                ?? '',

            resolvedUrl:
                resolvedUrl
                ?? request?.url
                ?? '',

            params:
                request?.params
                ?? [],

            headers:
                request?.headers
                ?? [],

            authorization:
                request?.authorization
                ?? null,

            requestBody:
                request?.body
                ?? '',

            response:
                response,

            environment:
                activeEnvironment,
        })
    }


const {
    response,
    isSending,
    sendRequest,
    cancelRequest,
} = useRequest(
    handleRequestSuccess,
    activeEnvironment,
    collectionState.selectedRequestId
)

function handleEnvironmentChange(
    environmentId
) {

    const updated =
        environments.map(
            environment => ({

                ...environment,

                active:
                    environment.id ===
                    environmentId

            })
        )


    const next =
        workspaces.map(
            workspace => {

                if (
                    workspace.id !==
                    activeWorkspaceId
                ) {

                    return workspace

                }


                return {

                    ...workspace,

                    environments:
                        updated

                }

            }
        )


    setWorkspaces(
        next
    )

}
function handleEnvironmentsChange(
    updatedEnvironments
) {

    const updatedWorkspaces =
        workspaces.map(
            workspace => {

                if (
                    workspace.id !==
                    activeWorkspaceId
                ) {

                    return workspace

                }


                return {

                    ...workspace,

                    environments:
                        updatedEnvironments

                }

            }
        )


    setWorkspaces(
        updatedWorkspaces
    )

}
    function handleDuplicateEnvironment(){

        if(!activeEnvironment) return


    const updated =
        duplicateEnvironment(
            environments,
            activeEnvironment.id
        )


        handleEnvironmentsChange(updated)

    }

    function handleDeleteEnvironment(){


        if(!activeEnvironment){
            return
        }


    const updated =
        deleteEnvironment(
            environments,
            activeEnvironment.id
        )


        handleEnvironmentsChange(updated)

    }

    function handleRenameEnvironment() {

        if (!activeEnvironment) return;

        setDialogState({
            open: true,
            type: "input",
            title: "Rename Environment",
            message: "Enter a new environment name.",
            initialValue: activeEnvironment.name,
            confirmLabel: "Rename",
            cancelLabel: "Cancel",

            onConfirm: (newName) => {

                setDialogState(current => ({
                    ...current,
                    open: false,
                }));

    const updated =
        renameEnvironment(
            environments,
            activeEnvironment.id,
            newName
        )


    handleEnvironmentsChange(updated)

            },

            onCancel: () =>
                setDialogState(current => ({
                    ...current,
                    open: false,
                })),
        });

    }




async function handleExportAllEnvironments() {

    if (
        !Array.isArray(environments) ||
        environments.length === 0
    ) {

        setDialogState({
            open: true,
            type: "confirm",
            title: "Export Environments",
            message: "There are no environments to export.",
            initialValue: "",
            options: [],
            confirmLabel: "OK",
            cancelLabel: "",
            onConfirm: () =>
                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                ),
            onCancel: () =>
                setDialogState(
                    current => ({
                        ...current,
                        open: false
                    })
                )
        })

        return
    }


    try {

        const content =
            JSON.stringify(
                {
                    version: 1,
                    environments
                },
                null,
                2
            )


        await saveTextFile({
            content,
            filename:
                "environments.json",
            filters: [
                {
                    name: "JSON Files",
                    extensions: ["json"]
                }
            ]
        })

    }
    catch (error) {

        setDialogState({

            open: true,

            type: "confirm",

            title: "Export failed",

            message:
                error?.message ||
                "Failed to export environments.",

            initialValue: "",

            options: [],

            confirmLabel: "OK",

            cancelLabel: "",

            onConfirm:
                () =>
                    setDialogState(
                        current => ({
                            ...current,
                            open: false
                        })
                    ),

            onCancel:
                () =>
                    setDialogState(
                        current => ({
                            ...current,
                            open: false
                        })
                    )

        })

    }

}



    function handleHistoryRestore(entry) {

        
        
        
        

    const requestTemplate = {

        name:
            entry?.name ??
            'Untitled Request',

        method:
            entry?.method ??
            'GET',

        url:
            entry?.resolvedUrl ||
            entry?.url ||
            '',

        params:
            entry?.params ??
            [],

        headers:
            entry?.headers ??
            [],

        authorization:
            entry?.authorization ??
            null,

        body:
            entry?.requestBody ??
            '',

        __historyTimestamp:
            entry?.timestamp ??
            Date.now(),
    }
        // DO NOT call restoreRequest()
        // DO NOT modify collections
        // DO NOT modify selectedRequestId

        collectionState.showHistoryRequest(
            requestTemplate
        )

        setHistoricalRequest({

            name:
                entry?.name ??
                'Untitled Request',

            timestamp:
                entry?.timestamp ??
                Date.now(),

        })
    }


    const handleRunHistoryEntry = async (entry) => {

    if (!entry) {
        return
    }

    // Restore the historical request first
    handleHistoryRestore(entry)

    // Open the request / response area
    setShowRunner(false)

    }



    function handleClearHistory() {
        setDialogState({ open: true, type: 'confirm', title: 'Clear history', message: 'Clear all history entries?', initialValue: '', options: [], confirmLabel: 'Clear', cancelLabel: 'Cancel', onConfirm: () => { setDialogState((current) => ({ ...current, open: false })); historyState.clearEntries() }, onCancel: () => setDialogState((current) => ({ ...current, open: false })) })
    }

    async function handleImportEnvironment() {
        const file = await pickTextFile()
        if (!file) return

        try {
    const importedEnvironment = await importEnvironmentFromFile(
        file,
    )

    

    setDialogState({
        open: true,
        type: 'choice',
        title: 'Import environment',
        message: 'Choose how to add the environment.',
        initialValue: 'merge',
        options: [
        {
            label: 'Merge into existing environments',
            value: 'merge',
        },
        {
            label: 'Replace current environments',
            value: 'replace',
        },
        ],
        confirmLabel: 'Import',
        cancelLabel: 'Cancel',

        onConfirm: (mode) => {

        setDialogState((current) => ({
            ...current,
            open: false,
        }))

        const shouldReplace = mode === 'replace'

        const nextEnvironments = shouldReplace
            ? [
                {
                ...importedEnvironment,
                active: true,
                },
            ]
            : [
                ...environments.map((environment) => ({
                ...environment,
                active: false,
                })),
                {
                ...importedEnvironment,
                active: true,
                },
            ]

        handleEnvironmentsChange(nextEnvironments)
        },

        onCancel: () =>
        setDialogState((current) => ({
            ...current,
            open: false,
        })),
    })

    } catch (error) {

    setDialogState({
        open: true,
        type: 'confirm',
        title: 'Import failed',
        message: error?.message || 'Import failed.',
        confirmLabel: 'OK',
        cancelLabel: '',
        onConfirm: () =>
        setDialogState((current) => ({
            ...current,
            open: false,
        })),
        onCancel: () =>
        setDialogState((current) => ({
            ...current,
            open: false,
        })),
    })

    }
    }








async function handleSyncGoogleDrive() {

    if (
        !googleDriveStatus?.authenticated
    ) {
        return
    }


    if (
        googleDriveSyncing
    ) {
        return
    }


    setGoogleDriveSyncing(
        true
    )


    try {

        console.log(
            "[GOOGLE DRIVE] Starting manual sync..."
        )


        /*
         * =========================================
         * STEP 1 — LOAD DRIVE
         * =========================================
         */

        const remoteState =
            await loadWorkspaceFromGoogleDrive()


        const remoteWorkspaces =
            Array.isArray(
                remoteState?.workspaces
            )
                ? remoteState.workspaces
                : []


        /*
         * =========================================
         * STEP 2 — DRIVE EMPTY
         * =========================================
         */

        if (
            remoteWorkspaces.length === 0
        ) {

            setDialogState({

                open:
                    true,

                type:
                    "choice",

                title:
                    "Google Drive is empty",

                message:
                    "There is no workspace data in Google Drive. Save your current local workspace to Google Drive?",

                initialValue:
                    "upload",

                options: [

                    {
                        label:
                            "Save Local Data to Google Drive",

                        value:
                            "upload"
                    },

                    {
                        label:
                            "Cancel",

                        value:
                            "cancel"
                    }

                ],

                confirmLabel:
                    "Continue",

                cancelLabel:
                    "Cancel",

                onConfirm:
                    async (choice) => {

                        setDialogState(
                            current => ({
                                ...current,
                                open: false
                            })
                        )


                        if (
                            choice !==
                            "upload"
                        ) {
                            return
                        }


                        try {

                            await saveWorkspaces(
                                workspaces
                            )


                            savedWorkspaceSnapshotRef.current =
                                JSON.stringify(
                                    workspaces
                                )


                            console.log(
                                "[GOOGLE DRIVE] Local workspace uploaded."
                            )

                        }
                        catch (error) {

                            console.error(
                                "[GOOGLE DRIVE] Initial upload failed:",
                                error
                            )

                        }

                    }

            })


            return
        }


        /*
         * =========================================
         * STEP 3 — COMPARE LOCAL VS DRIVE
         * =========================================
         */

        const comparison =
            await compareWorkspaceWithGoogleDrive(
                remoteState
            )


        console.log(
            "[GOOGLE DRIVE] Manual sync comparison:",
            comparison
        )


        /*
         * =========================================
         * STEP 4 — ALREADY SYNCHRONIZED
         * =========================================
         */

        if (
            comparison.status ===
            "SAME"
        ) {

            console.log(
                "[GOOGLE DRIVE] Local and Drive are already synchronized.",
                {
                    revision:
                        comparison.localRevision
                }
            )


            setSaveStatus({

                state:
                    "saved",

                message:
                    "Already synchronized with Google Drive"

            })


            return
        }


        /*
         * =========================================
         * STEP 5 — ASK WHICH VERSION TO KEEP
         * =========================================
         */

        setDialogState({

            open:
                true,

            type:
                "choice",

            title:
                comparison.status ===
                "LOCAL_NEWER"
                    ? "Local Workspace Is Newer"
                    : "Google Drive Workspace",

            message:
                comparison.status ===
                "LOCAL_NEWER"
                    ? `Your local workspace is newer than Google Drive.

Local revision: ${comparison.localRevision}
Google Drive revision: ${comparison.driveRevision}

Which version would you like to keep?`
                    : `Google Drive contains a newer workspace.

Local revision: ${comparison.localRevision}
Google Drive revision: ${comparison.driveRevision}

Which version would you like to keep?`,

            initialValue:
                comparison.status ===
                "LOCAL_NEWER"
                    ? "local"
                    : "drive",

            options: [

                {
                    label:
                        comparison.status ===
                        "LOCAL_NEWER"
                            ? "Keep Local Data and Upload to Google Drive"
                            : "Use Google Drive Data",

                    value:
                        comparison.status ===
                        "LOCAL_NEWER"
                            ? "local"
                            : "drive"
                },

                {
                    label:
                        comparison.status ===
                        "LOCAL_NEWER"
                            ? "Use Google Drive Data"
                            : "Keep Local Data and Upload to Google Drive",

                    value:
                        comparison.status ===
                        "LOCAL_NEWER"
                            ? "drive"
                            : "local"
                }

            ],

            confirmLabel:
                "Continue",

            cancelLabel:
                "Cancel",

            onConfirm:
                async (choice) => {

                    setDialogState(
                        current => ({
                            ...current,
                            open: false
                        })
                    )


                    /*
                     * =================================
                     * USE GOOGLE DRIVE
                     * =================================
                     */

                    if (
                        choice ===
                        "drive"
                    ) {

                        const activeId =
                            remoteState.activeWorkspaceId ??
                            remoteWorkspaces[0]?.id ??
                            null


                        await applyGoogleDriveWorkspaceLocally(

                            remoteWorkspaces,

                            activeId,

                            remoteState.revision,

                            remoteState.version,

                            remoteState.updatedAt

                        )


                        setWorkspaces(
                            remoteWorkspaces
                        )


                        setActiveWorkspaceId(
                            activeId
                        )


                        savedWorkspaceSnapshotRef.current =
                            JSON.stringify(
                                remoteWorkspaces
                            )


                        setSaveStatus({

                            state:
                                "saved",

                            message:
                                "Synced from Google Drive"

                        })


                        console.log(
                            "[GOOGLE DRIVE] Drive workspace applied locally."
                        )


                        return
                    }


                    /*
                     * =================================
                     * KEEP LOCAL
                     * =================================
                     */

                    if (
                        choice ===
                        "local"
                    ) {

                        await saveWorkspaces(
                            workspaces
                        )


                        savedWorkspaceSnapshotRef.current =
                            JSON.stringify(
                                workspaces
                            )


                        setSaveStatus({

                            state:
                                "saved",

                            message:
                                "Local workspace uploaded to Google Drive"

                        })


                        console.log(
                            "[GOOGLE DRIVE] Local workspace uploaded."
                        )

                    }

                }

        })

    }
    catch (error) {

        console.error(
            "[GOOGLE DRIVE] Manual sync failed:",
            error
        )


        setDialogState({

            open:
                true,

            type:
                "confirm",

            title:
                "Google Drive Sync Failed",

            message:
                error?.message ||
                "Unable to sync with Google Drive.",

            initialValue:
                "",

            options:
                [],

            confirmLabel:
                "OK",

            cancelLabel:
                "",

            onConfirm:
                () =>
                    setDialogState(
                        current => ({
                            ...current,
                            open: false
                        })
                    ),

            onCancel:
                () =>
                    setDialogState(
                        current => ({
                            ...current,
                            open: false
                        })
                    )

        })

    }
    finally {

        setGoogleDriveSyncing(
            false
        )

    }

}


async function handleDisconnectGoogleDrive() {

    try {

        await disconnectGoogleDrive()


        setGoogleDriveStatus({

            authenticated:
                false,

            user:
                null

        })


        console.log(
            "[GOOGLE DRIVE] Disconnected."
        )

    }
    catch (error) {

        console.error(
            "[GOOGLE DRIVE] Disconnect failed:",
            error
        )


        setDialogState({

            open: true,

            type:
                "confirm",

            title:
                "Disconnect Google Drive",

            message:
                error?.message ||
                "Unable to disconnect Google Drive.",

            initialValue:
                "",

            options:
                [],

            confirmLabel:
                "OK",

            cancelLabel:
                "",

            onConfirm:
                () =>
                    setDialogState(
                        current => ({
                            ...current,
                            open: false
                        })
                    ),

            onCancel:
                () =>
                    setDialogState(
                        current => ({
                            ...current,
                            open: false
                        })
                    )

        })

    }

}


    async function handleExportEnvironment() {
        if (!activeEnvironment) return

        try {
        const content = await exportEnvironmentData(activeEnvironment)
        await saveTextFile({
            content,
            filename: `${activeEnvironment.name}.json`,
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
        })
        } catch (error) {
        setDialogState({ open: true, type: 'confirm', title: 'Export failed', message: error?.message || 'Export failed.', initialValue: '', options: [], confirmLabel: 'OK', cancelLabel: '', onConfirm: () => setDialogState((current) => ({ ...current, open: false })), onCancel: () => setDialogState((current) => ({ ...current, open: false })) })
        }
    }

    useEffect(() => {
        const off = onRuntimeMenuAction((action) => {
        switch (action) {
            case 'menu:new-collection':
            collectionState.createNewCollection()
            break
            case 'menu:import-collection':
            collectionState.importCollection()
            break
            case 'menu:import-environment':
            handleImportEnvironment()
            break
            case 'menu:export-collection':
            collectionState.exportCollection()
            break
            case 'menu:export-environment':
            handleExportEnvironment()
            break
            default:
            break
        }
        })

        return off
    }, [collectionState, environments, activeEnvironment])


    if (showHomePage) {
    return (
        <HomePage
            onContinueOnline={() => {
                setShowHomePage(false)
            }}
        />
    )
}

        if (
        isAuthChecking
    ) {
if (showHomePage) {
    return (
        <HomePage
            onContinueOnline={() => {
                setShowHomePage(false)
            }}
        />
    )
}

        return (
            <div className="login-screen">

                <div className="login-card">

                    <div className="login-title">
                        Loading...
                    </div>

                </div>

            </div>
        )

    }


if (
    !authenticatedUser
) {



    if (
        showRegisterScreen
    ) {

        return (
            <RegisterScreen
                onRegistered={() => {
                    setShowRegisterScreen(
                        false
                    )
                }}

                onBackToLogin={() => {
                    setShowRegisterScreen(
                        false
                    )
                }}
            />
        )
    }


    return (
        <LoginScreen
            onLogin={
                handleLogin
            }

            onRegister={() => {
                setShowRegisterScreen(
                    true
                )
            }}
        />
    )
}

    return (
        <>
        <AppLayout header={
    <Header

        /* =========================
        ENVIRONMENT (KEEP FOR FUTURE)
        ========================= */

        environments={environments}

        onEnvironmentChange={
            handleEnvironmentChange
        }

        onRenameEnvironment={
            handleRenameEnvironment
        }

        onImportEnvironment={
            handleImportEnvironment
        }

        onExportEnvironment={
            handleExportEnvironment
        }

        onDuplicateEnvironment={
            handleDuplicateEnvironment
        }

        onDeleteEnvironment={
            handleDeleteEnvironment
        }

        onExportAllEnvironments={
            handleExportAllEnvironments
        }

        onConnectGoogleDrive={handleConnectGoogleDrive}

        saveStatus={
    saveStatus
}

authenticatedUser={
    authenticatedUser
}

onLogout={
    handleLogout
}

        googleDriveStatus={
    googleDriveStatus
}

googleDriveSyncing={
    googleDriveSyncing
}

onSyncGoogleDrive={
    handleSyncGoogleDrive
}

onDisconnectGoogleDrive={
    handleDisconnectGoogleDrive
}



        /* =========================
        WORKSPACE
        ========================= */

        workspaces={
            workspaces
        }


        selectedWorkspace={
            activeWorkspace?.name
        }


        onWorkspaceChange={
            handleWorkspaceChange
        }



        /* =========================
        WORKSPACE ACTIONS
        ========================= */

        onCreateWorkspace={
            handleCreateWorkspace
        }


        onRenameWorkspace={
            handleRenameWorkspace
        }


        onDeleteWorkspace={
            handleDeleteWorkspace
        }


        onImportWorkspace={
            handleImportWorkspace
        }


        onExportWorkspace={
            handleExportWorkspace
        }



        /* =========================
        SIDEBAR
        ========================= */

        sidebarOpen={
            sidebarOpen
        }


        setSidebarOpen={
            setSidebarOpen
        }

    />
    } sidebar={<Sidebar
    collections={collectionState.collections}
    selectedRequestId={collectionState.selectedRequestId}
    onToggleEnvironmentPanel={toggleEnvironmentPanel}
    onCreateCollection={collectionState.createNewCollection}
    onCreateFolder={collectionState.createFolder}
    onImportCollection={collectionState.importCollection}

    onRenameFolder={collectionState.renameFolder}
    onDuplicateFolder={collectionState.duplicateFolder}
    onDeleteFolder={collectionState.deleteFolder}
    onExportFolder={collectionState.exportFolder}

    onExportCollection={collectionState.exportCollection}
    onImportIntoCollection={collectionState.importCollectionIntoCollection}

    onCreateRequest={collectionState.createNewRequest}
    onRunNode={handleRunNode}  


    onSelectRequest={(collectionId, requestId) => {

        setHistoricalRequest(null)

        collectionState.selectRequest(
            collectionId,
            requestId
        )

    }}

    onToggleCollection={collectionState.toggleCollection}

    onRenameCollection={collectionState.renameCollection}
    onDuplicateCollection={collectionState.duplicateCollection}
    onDeleteCollection={collectionState.deleteCollection}

    onRenameRequest={collectionState.renameRequest}
    onDuplicateRequest={collectionState.duplicateRequest}
    onDeleteRequest={collectionState.deleteRequest}
    onMoveNode={collectionState.moveCollectionNode}

    historyEntries={historyState.displayHistory}
    favorites={historyState.favorites}
    historySearch={historyState.searchQuery}
    activeHistoryFilter={historyState.filter}

    onHistorySearchChange={historyState.setSearchQuery}
    onHistoryFilterChange={historyState.setFilter}

    onRestoreHistoryEntry={handleHistoryRestore}
    onRunHistoryEntry={handleRunHistoryEntry}
    onDeleteHistoryEntry={historyState.deleteEntry}
    onToggleHistoryFavorite={historyState.toggleFavorite}
    onClearHistory={handleClearHistory}
    />} 

    environmentPanel={
    environmentPanelOpen ? (
        <EnvironmentPanel
        environments={environments}
            activeRequest={collectionState.selectedRequest}

        onEnvironmentChange={handleEnvironmentChange}
        onEnvironmentsChange={handleEnvironmentsChange}
        onImportEnvironment={handleImportEnvironment}
        onExportEnvironment={handleExportEnvironment}
        onRenameEnvironment={handleRenameEnvironment}
        onDuplicateEnvironment={handleDuplicateEnvironment}
        onExportAllEnvironments={handleExportAllEnvironments}
        onDeleteEnvironment={handleDeleteEnvironment}
        />
    ) : null
    }


    >
        {
    runnerState.open ? (

    <RunnerScreen
    open={runnerState.open}

    collections={
        collections.filter(
        (collection) =>
            collection.id === runnerState.collectionId
        )
    }

    initialCollectionId={runnerState.collectionId}
    initialNodeId={runnerState.nodeId}

    executeRequest={sendRequest}

    onRunnerHistoryEntry={(entry) => {
        historyState.addEntry(entry)
    }}

    onClose={() =>
        setRunnerState({
        open: false,
        collectionId: null,
        nodeId: null,
        })
    }
    />

    ) : (

<Workspace
    environment={activeEnvironment}
    isSending={isSending}
    onSend={sendRequest}
    onCancel={cancelRequest}
    response={response}
    request={collectionState.selectedRequest}
    onRequestChange={collectionState.updateRequest}
/>
    )
    }
    </AppLayout>

    <SharedDialog
        open={dialogState.open}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        initialValue={dialogState.initialValue}
        options={dialogState.options}
        confirmLabel={dialogState.confirmLabel}
        cancelLabel={dialogState.cancelLabel}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
    />

<SharedDialog
    open={closeRequested}
    type="close-confirm"
    title="Unsaved changes"
    message={`Do you want to save the changes you made to the following ${getChangedRequestItems().length} items?`}
    items={getChangedRequestItems()}
    confirmLabel="Save All"

onConfirm={async () => {

    const saved =
        await saveCurrentWorkspaceChanges()


    if (!saved) {

        console.error(
            "[CLOSE] Save All failed."
        )

        return

    }


    setCloseRequested(false)

    forceCloseRuntimeWindow()

}}


    onCancel={async (action) => {

        // =========================================
        // DON'T SAVE
        // =========================================

        if (action === 'dont-save') {

            try {

                const savedSnapshot =
                    savedWorkspaceSnapshotRef.current

if (savedSnapshot) {

    const restoredWorkspaces =
        JSON.parse(savedSnapshot)

    setWorkspaces(
        restoredWorkspaces
    )

    savedWorkspaceSnapshotRef.current =
        savedSnapshot
}
                setCloseRequested(false)

                forceCloseRuntimeWindow()

            } catch (error) {

                console.error(
                    '[CLOSE] Failed to discard changes:',
                    error
                )

            }

            return
        }


        // =========================================
        // CANCEL
        // =========================================

        if (action === 'cancel') {

            setCloseRequested(false)

            return
        }


        // =========================================
        // TOP-RIGHT X
        // =========================================

        setCloseRequested(false)

    }}
/>
        </>
        )
    
    }
    export default App
