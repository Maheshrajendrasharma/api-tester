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
    loadEnvironments,
    saveEnvironments,
    setActiveEnvironment,
    duplicateEnvironment,
    deleteEnvironment,
    renameEnvironment,
} from './services/environmentService'

import { exportEnvironment as exportEnvironmentData, importEnvironmentFromFile } from './services/importExportService'

function App() {
  const [dialogState, setDialogState] = useState({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], onConfirm: null, onCancel: null })

  const collectionState = useCollections({ onShowDialog: setDialogState })
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
  const [environments, setEnvironments] = useState(loadEnvironments)
  
  const activeEnvironment = environments.find((environment) => environment.active) ?? null

  function handleEnvironmentChange(environmentId) {
    setEnvironments(setActiveEnvironment(environmentId))
  }

  function handleEnvironmentsChange(updatedEnvironments) {
    saveEnvironments(updatedEnvironments)
    setEnvironments(updatedEnvironments)
  }

function handleDuplicateEnvironment() {

    if (!activeEnvironment) return

    const updated = duplicateEnvironment(activeEnvironment.id)

    setEnvironments(updated)

}

function handleDeleteEnvironment() {

    if (!activeEnvironment) return

    const updated = deleteEnvironment(activeEnvironment.id)

    setEnvironments(updated)

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

            const updated = renameEnvironment(
                activeEnvironment.id,
                newName
            );

            setEnvironments(updated);

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
    environments={environments}
    onEnvironmentChange={handleEnvironmentChange}
onRenameEnvironment={handleRenameEnvironment}
    onImportEnvironment={handleImportEnvironment}
    onExportEnvironment={handleExportEnvironment}

    onDuplicateEnvironment={handleDuplicateEnvironment}

    onDeleteEnvironment={handleDeleteEnvironment}

    onExportAllEnvironments={handleExportAllEnvironments}
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
/>}>
        <Workspace environment={activeEnvironment} isSending={isSending} onSend={sendRequest} response={response} request={collectionState.selectedRequest} onRequestChange={collectionState.updateRequest} />
      </AppLayout>
      <SharedDialog open={dialogState.open} type={dialogState.type} title={dialogState.title} message={dialogState.message} initialValue={dialogState.initialValue} options={dialogState.options} confirmLabel={dialogState.confirmLabel} cancelLabel={dialogState.cancelLabel} onConfirm={dialogState.onConfirm} onCancel={dialogState.onCancel} />
    </>
  )
}

export default App
