import ActionMenu from './ActionMenu'
import CollectionRow from './CollectionRow'
import MethodBadge from './MethodBadge'
import SidebarRow from './SidebarRow'

function Sidebar({ collections, selectedRequestId, onCreateCollection, onCreateRequest, onSelectRequest, onToggleCollection, onRenameCollection, onDuplicateCollection, onDeleteCollection, onRenameRequest, onDuplicateRequest, onDeleteRequest }) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">A</span>API Tester</div>
      <div className="sidebar-section-header"><span>Collections</span></div>
      <button className="new-collection-button" type="button" onClick={onCreateCollection}>+ New Collection</button>
      <nav className="collection-list" aria-label="Collections">
        {collections.map((collection) => (
          <div className="collection-group" key={collection.id}>
            <CollectionRow collection={collection} onToggle={() => onToggleCollection(collection.id)} onCreateRequest={() => onCreateRequest(collection.id)} onRename={() => onRenameCollection(collection.id)} onDuplicate={() => onDuplicateCollection(collection.id)} onDelete={() => onDeleteCollection(collection.id)} />
            {collection.expanded && collection.requests.map((request) => (
              <SidebarRow className="request-row" selected={selectedRequestId === request.id} key={request.id} onClick={() => onSelectRequest(collection.id, request.id)}>
                <MethodBadge method={request.method} />
                <span className="sidebar-row-title">{request.name}</span>
                <ActionMenu label="Request actions" actions={[
                  { label: 'Rename', onClick: () => onRenameRequest(collection.id, request.id) },
                  { label: 'Duplicate', onClick: () => onDuplicateRequest(collection.id, request.id) },
                  { label: 'Delete', onClick: () => onDeleteRequest(collection.id, request.id), destructive: true },
                ]} />
              </SidebarRow>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
