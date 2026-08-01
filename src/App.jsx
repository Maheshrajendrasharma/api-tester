import { useState } from 'react'
import './styles/variables.css'
import './styles/theme.css'
import './styles/scrollbars.css'
import './styles/layout.css'
import AppLayout from './components/AppLayout'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'
import EnvironmentPanel from './components/EnvironmentPanel'
import { useCollections } from './hooks/useCollections'
import { useRequest } from './hooks/useRequest'
import Header from './components/Header'
import { loadEnvironments, saveEnvironments, setActiveEnvironment } from './services/environmentService'

function App() {
  const collectionState = useCollections()
  const { response, isSending, sendRequest } = useRequest()
  const [environments, setEnvironments] = useState(loadEnvironments)

  function handleEnvironmentChange(environmentId) {
    setEnvironments(setActiveEnvironment(environmentId))
  }

  function handleEnvironmentsChange(updatedEnvironments) {
    saveEnvironments(updatedEnvironments)
    setEnvironments(updatedEnvironments)
  }

  return (
    <AppLayout header={<Header environments={environments} onEnvironmentChange={handleEnvironmentChange} />} sidebar={<Sidebar collections={collectionState.collections} selectedRequestId={collectionState.selectedRequestId} onCreateCollection={collectionState.createNewCollection} onCreateRequest={collectionState.createNewRequest} onSelectRequest={collectionState.selectRequest} onToggleCollection={collectionState.toggleCollection} onRenameCollection={collectionState.renameCollection} onDuplicateCollection={collectionState.duplicateCollection} onDeleteCollection={collectionState.deleteCollection} onRenameRequest={collectionState.renameRequest} onDuplicateRequest={collectionState.duplicateRequest} onDeleteRequest={collectionState.deleteRequest} />} environmentPanel={<EnvironmentPanel environments={environments} onEnvironmentChange={handleEnvironmentChange} onEnvironmentsChange={handleEnvironmentsChange} />}>
      <Workspace isSending={isSending} onSend={sendRequest} response={response} request={collectionState.selectedRequest} onRequestChange={collectionState.updateRequest} />
    </AppLayout>
  )
}

export default App
