import './styles/variables.css'
import './styles/theme.css'
import './styles/scrollbars.css'
import './styles/layout.css'
import AppLayout from './components/AppLayout'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'
import { useCollections } from './hooks/useCollections'
import { useRequest } from './hooks/useRequest'

function App() {
  const collectionState = useCollections()
  const { response, isSending, sendRequest } = useRequest()

  return (
    <AppLayout sidebar={<Sidebar collections={collectionState.collections} selectedRequestId={collectionState.selectedRequestId} onCreateCollection={collectionState.createNewCollection} onCreateRequest={collectionState.createNewRequest} onSelectRequest={collectionState.selectRequest} onToggleCollection={collectionState.toggleCollection} onRenameCollection={collectionState.renameCollection} onDuplicateCollection={collectionState.duplicateCollection} onDeleteCollection={collectionState.deleteCollection} onRenameRequest={collectionState.renameRequest} onDuplicateRequest={collectionState.duplicateRequest} onDeleteRequest={collectionState.deleteRequest} />}>
      <Workspace isSending={isSending} onSend={sendRequest} response={response} request={collectionState.selectedRequest} onRequestChange={collectionState.updateRequest} />
    </AppLayout>
  )
}

export default App
