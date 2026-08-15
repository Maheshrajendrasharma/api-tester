import { useEffect, useState } from 'react'
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



import {
    loadWorkspaces,
    saveWorkspaces
} from './services/workspaceService'

import { exportEnvironment as exportEnvironmentData, importEnvironmentFromFile } from './services/importExportService'




function App() {
  const [sidebarOpen, setSidebarOpen] =useState(true)

  const [dialogState, setDialogState] = useState({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], onConfirm: null, onCancel: null })








  const historyState = useHistory({ onShowDialog: setDialogState })
  const { response, isSending, sendRequest } = useRequest(({ request, response: responseData, resolvedUrl }) => {
    historyState.addEntry({
      name: request.name || 'Untitled Request',
      method: request.method,
      url: request.url,
      resolvedUrl,
      statusCode: responseData.status,
      statusText: responseData.statusText,
      responseTime: responseData.responseTime,
      responseSize: responseData.responseSize,
      environment: historyState.activeEnvironment,
      headers: request.headers ?? [],
      params: request.params ?? [],
      authorization: request.authorization ?? null,
      requestBody: request.body ?? '',
      responseBody: responseData.responseBody ?? '',
    })
  })

 
const [workspaces,setWorkspaces] =
useState(() => loadWorkspaces())


const [activeWorkspaceId,setActiveWorkspaceId] =
useState(
    () => loadWorkspaces()[0]?.id
)


const activeWorkspace =
    workspaces.find(
        workspace =>
        workspace.id === activeWorkspaceId
    )


  function handleWorkspaceChange(workspace){

    setActiveWorkspaceId(
        workspace.id
    )

}



function handleCreateWorkspace(){

    const name =
        window.prompt(
            "Enter workspace name"
        );


    if(!name || !name.trim()){
        return;
    }


    const newWorkspace = {

        id: crypto.randomUUID(),

        name:name.trim(),

        collections:[],

        environments:[]

    };


    const updated = [

        ...workspaces,

        newWorkspace

    ];


    setWorkspaces(updated);


    setActiveWorkspaceId(
        newWorkspace.id
    );


    saveWorkspaces(updated);

}

function handleRenameWorkspace(){

    const current =
        activeWorkspace;


    if(!current){
        return;
    }


    const newName =
        window.prompt(
            "Rename workspace",
            current.name
        );


    if(!newName || !newName.trim()){
        return;
    }


    const updated =
        workspaces.map(workspace=>

            workspace.id === current.id

            ?

            {
                ...workspace,
                name:newName.trim()
            }

            :

            workspace

        );


    setWorkspaces(updated);


    saveWorkspaces(updated);

}




function handleDeleteWorkspace(){

    if(workspaces.length <= 1){

        alert(
            "At least one workspace is required"
        );

        return;

    }


    const confirmDelete =
        window.confirm(
            "Delete current workspace?"
        );


    if(!confirmDelete){
        return;
    }


    const updated =
        workspaces.filter(
            workspace =>
            workspace.id !== activeWorkspace.id
        );


    setWorkspaces(updated);


    setActiveWorkspaceId(
        updated[0].id
    );


    saveWorkspaces(updated);

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









    const environments =
    activeWorkspace?.environments ?? []


const collections =
    activeWorkspace?.collections ?? []


const collectionState =
useCollections({

    workspaceId:
        activeWorkspace?.id,


    workspaceCollections:
        activeWorkspace?.collections || [],


    onCollectionsChange:
        handleWorkspaceCollectionsChange,


    onShowDialog:
        setDialogState

})


function handleWorkspaceCollectionsChange(
    collections
){

    setWorkspaces(
        previous =>
        previous.map(
            workspace =>

            workspace.id === activeWorkspaceId

            ?

            {
                ...workspace,
                collections
            }

            :

            workspace
        )
    )

}



  const activeEnvironment = environments.find((environment) => environment.active) ?? null

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
      name: entry.name,
      method: entry.method,
      url: entry.resolvedUrl || entry.url,
      params: entry.params ?? [],
      headers: entry.headers ?? [],
      authorization: entry.authorization ?? null,
      body: entry.requestBody ?? '',
    }

    collectionState.restoreRequest(requestTemplate)
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

  console.log(importedEnvironment)

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
  onSelectRequest={collectionState.selectRequest}
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
  onRenameHistoryEntry={historyState.renameEntry}
  onDuplicateHistoryEntry={historyState.duplicateEntry}
  onDeleteHistoryEntry={historyState.deleteEntry}
  onToggleHistoryFavorite={historyState.toggleFavorite}
  onClearHistory={handleClearHistory}
/>} environmentPanel={<EnvironmentPanel
    environments={environments}
    onEnvironmentChange={handleEnvironmentChange}
    onEnvironmentsChange={handleEnvironmentsChange}
    onImportEnvironment={handleImportEnvironment}
    onExportEnvironment={handleExportEnvironment}
    onRenameEnvironment={handleRenameEnvironment}
    onDuplicateEnvironment={handleDuplicateEnvironment}
    onExportAllEnvironments={handleExportAllEnvironments}
    onDeleteEnvironment={handleDeleteEnvironment}
/>}>
        <Workspace environment={activeEnvironment} isSending={isSending} onSend={sendRequest} response={response} request={collectionState.selectedRequest} onRequestChange={collectionState.updateRequest} />
      </AppLayout>
      <SharedDialog open={dialogState.open} type={dialogState.type} title={dialogState.title} message={dialogState.message} initialValue={dialogState.initialValue} options={dialogState.options} confirmLabel={dialogState.confirmLabel} cancelLabel={dialogState.cancelLabel} onConfirm={dialogState.onConfirm} onCancel={dialogState.onCancel} />
    </>
  )
}

export default App
