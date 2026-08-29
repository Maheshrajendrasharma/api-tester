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



    import {
        loadWorkspaces,
        saveWorkspaces,
        createWorkspace,
            loadActiveWorkspaceId,
        saveActiveWorkspaceId
    } from './services/workspaceService'

    import { exportEnvironment as exportEnvironmentData, importEnvironmentFromFile } from './services/importExportService'




    function App() {
    const [sidebarOpen, setSidebarOpen] =useState(true)

    const [environmentPanelOpen, setEnvironmentPanelOpen] = useState(true)

    const [historicalRequest, setHistoricalRequest] = useState(null)

    const toggleEnvironmentPanel = () => {
        setEnvironmentPanelOpen(prev => !prev)
    }

    const [dialogState, setDialogState] = useState({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], onConfirm: null, onCancel: null })


    const [closeRequested, setCloseRequested] =
        useState(false);

    const savedWorkspaceSnapshotRef =
    useRef(null)






    const historyState = useHistory({ onShowDialog: setDialogState })

    




    
    const [workspaces, setWorkspaces] =
        useState(() => loadWorkspaces())




    useEffect(() => {

    if (
        savedWorkspaceSnapshotRef.current === null
    ) {

        savedWorkspaceSnapshotRef.current =
            JSON.stringify(workspaces)

    }

}, [workspaces])



useEffect(() => {

    if (!window.apiTester?.onRequestClose) {
        return
    }

    const removeCloseListener =
        window.apiTester.onRequestClose(() => {

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

            window.apiTester?.forceCloseWindow?.()

        })

    return () => {

        if (removeCloseListener) {
            removeCloseListener()
        }

    }

}, [workspaces])


    const [activeWorkspaceId, setActiveWorkspaceId] =
        useState(() => {

            const loadedWorkspaces =
                loadWorkspaces()

            const savedWorkspaceId =
                loadActiveWorkspaceId()

            const savedWorkspaceExists =
                loadedWorkspaces.some(
                    workspace =>
                        workspace.id === savedWorkspaceId
                )

            if (savedWorkspaceExists) {
                return savedWorkspaceId
            }

            return loadedWorkspaces[0]?.id ?? null
        })


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


    function handleWorkspaceChange(workspace){

        setActiveWorkspaceId(
            workspace.id
        )
            saveActiveWorkspaceId(
            workspace.id
        )

    }




    function handleCreateWorkspace() {

        setDialogState({
            open: true,
            type: "input",
            title: "New Workspace",
            message: "Enter a name for the new workspace.",
            initialValue: "",
            options: [],
            confirmLabel: "Create",
            cancelLabel: "Cancel",

            onConfirm: (workspaceName) => {

                const name =
                    String(workspaceName || "").trim()

                if (!name) {
                    return
                }

    const newWorkspace = {
        id: crypto.randomUUID(),
        name,
        collections: [],
        environments: [],
        selectedRequestId: null
    }
                const updated = [
                    ...workspaces,
                    newWorkspace,
                ]

                setWorkspaces(updated)

                saveWorkspaces(updated)

                setActiveWorkspaceId(
                    newWorkspace.id
                )

                saveActiveWorkspaceId(
                    newWorkspace.id
                )

                setDialogState((current) => ({
                    ...current,
                    open: false,
                }))
            },

            onCancel: () =>
                setDialogState((current) => ({
                    ...current,
                    open: false,
                })),
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
            message: "Enter a new name for the workspace.",
            initialValue: currentWorkspace.name,
            options: [],
            confirmLabel: "Rename",
            cancelLabel: "Cancel",

            onConfirm: (newName) => {

                const name =
                    String(newName || "").trim()

                if (!name) {
                    return
                }

                const updated =
                    workspaces.map(
                        (workspace) =>

                            workspace.id ===
                            currentWorkspace.id

                                ? {
                                    ...workspace,
                                    name,
                                }

                                : workspace
                    )

                setWorkspaces(updated)

                saveWorkspaces(updated)

                setDialogState((current) => ({
                    ...current,
                    open: false,
                }))
            },

            onCancel: () =>
                setDialogState((current) => ({
                    ...current,
                    open: false,
                })),
        })
    }



    function handleDeleteWorkspace() {

        const currentWorkspace =
            activeWorkspace

        if (!currentWorkspace) {
            return
        }

        /*
        Do not allow the last workspace
        to be deleted.
        */

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

            confirmLabel: "Save",

            cancelLabel: "Cancel",


            onConfirm: (value) => {

                /*
                User must type exactly:
                DELETE
                */

                if (
                    String(value || "").trim() !==
                    "DELETE"
                ) {

                    return

                }


                const updated =
                    workspaces.filter(
                        (workspace) =>
                            workspace.id !==
                            currentWorkspace.id
                    )


                if (updated.length === 0) {
                    return
                }


                const nextWorkspace =
                    updated[0]


                setWorkspaces(updated)

                saveWorkspaces(updated)


                setActiveWorkspaceId(
                    nextWorkspace.id
                )


                saveActiveWorkspaceId(
                    nextWorkspace.id
                )


                setDialogState((current) => ({
                    ...current,
                    open: false,
                }))

            },


            onCancel: () => {

                setDialogState((current) => ({
                    ...current,
                    open: false,
                }))

            },

        })
    }

    function handleImportWorkspace(){

        alert(
            "Import workspace coming next"
        );

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


    function handleWorkspaceCollectionsChange(collections) {

        setWorkspaces((currentWorkspaces) => {

            const updatedWorkspaces =
                currentWorkspaces.map((workspace) => {

                    if (
                        workspace.id !==
                        activeWorkspaceId
                    ) {
                        return workspace
                    }

                    return {
                        ...workspace,
                        collections,
                    }
                })


            saveWorkspaces(
                updatedWorkspaces
            )


            return updatedWorkspaces

        })

    }


    function handleSelectedRequestChange(
        requestId
    ) {

        setWorkspaces((currentWorkspaces) => {

            const updatedWorkspaces =
                currentWorkspaces.map(
                    (workspace) => {

                        if (
                            workspace.id !==
                            activeWorkspaceId
                        ) {
                            return workspace
                        }

                        return {
                            ...workspace,

                            selectedRequestId:
                                requestId,
                        }

                    }
                )


            saveWorkspaces(
                updatedWorkspaces
            )


            return updatedWorkspaces

        })

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

    function handleEnvironmentChange(environmentId){

    const updated =
        environments.map(env => ({
            ...env,
            active:
                env.id === environmentId
        }))


    const next =
    workspaces.map(ws=>{

        if(ws.id!==activeWorkspaceId)
            return ws


        return {
            ...ws,
            environments:updated
        }

    })


    setWorkspaces(next)

    saveWorkspaces(next)

    }

    function handleEnvironmentsChange(updatedEnvironments) {


        const updatedWorkspaces =
            workspaces.map(workspace => {


                if(workspace.id !== activeWorkspaceId){
                    return workspace
                }


                return {
                    ...workspace,

                    environments:
                        updatedEnvironments
                }


            })


        setWorkspaces(updatedWorkspaces)

        saveWorkspaces(updatedWorkspaces)

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




    function handleExportAllEnvironments() {

        alert("Export All Environments - Coming Soon");

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
        const dialog = await window.apiTester?.showOpenDialog?.({
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        })

        if (!dialog || dialog.canceled || !dialog.filePaths?.[0]) return

        const content = await window.apiTester?.readFile?.(dialog.filePaths[0])
        if (!content) return

        try {
    const importedEnvironment = await importEnvironmentFromFile(
        new File([content], 'environment.json', {
        type: 'application/json',
        }),
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
    async function handleExportEnvironment() {
        if (!activeEnvironment) return

        try {
        const content = await exportEnvironmentData(activeEnvironment)
        const dialog = await window.apiTester?.showSaveDialog?.({
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
            defaultPath: `${activeEnvironment.name}.json`,
        })

        if (!dialog || dialog.canceled || !dialog.filePath) return
        await window.apiTester?.writeFile?.(dialog.filePath, content)
        } catch (error) {
        setDialogState({ open: true, type: 'confirm', title: 'Export failed', message: error?.message || 'Export failed.', initialValue: '', options: [], confirmLabel: 'OK', cancelLabel: '', onConfirm: () => setDialogState((current) => ({ ...current, open: false })), onCancel: () => setDialogState((current) => ({ ...current, open: false })) })
        }
    }

    useEffect(() => {
        const off = window.apiTester?.onMenuAction?.((action) => {
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

    try {

        await Promise.resolve(
            saveWorkspaces(workspaces)
        )

        savedWorkspaceSnapshotRef.current =
            JSON.stringify(workspaces)

        setCloseRequested(false)

        window.apiTester?.forceCloseWindow?.()

    } catch (error) {

        console.error(
            '[CLOSE] Save All failed:',
            error
        )

    }

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

                    await Promise.resolve(
                        saveWorkspaces(
                            restoredWorkspaces
                        )
                    )
                }

                setCloseRequested(false)

                window.apiTester?.forceCloseWindow?.()

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
