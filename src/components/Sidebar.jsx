import ActionMenu from './ActionMenu'
import CollectionRow from './CollectionRow'
import MethodBadge from './MethodBadge'
import SidebarRow from './SidebarRow'
import { useState } from 'react'


function Sidebar({ collections, selectedRequestId, onCreateCollection, onImportCollection, onExportCollection, onImportIntoCollection, onCreateRequest, onSelectRequest, onToggleCollection, onRenameCollection, onDuplicateCollection, onDeleteCollection, onRenameRequest, onDuplicateRequest, onDeleteRequest, historyEntries, historySearch, activeHistoryFilter, onHistorySearchChange, onHistoryFilterChange, onRestoreHistoryEntry, onRenameHistoryEntry, onDuplicateHistoryEntry, onDeleteHistoryEntry, onToggleHistoryFavorite, onClearHistory }) {
      const [sidebarView, setSidebarView] = useState("collections")

  
  return (
    <aside className="sidebar">

  <div
    className="sidebar-section-header"
    onMouseEnter={() => setSidebarView("collections")}
>
    <span>COLLECTIONS</span>
</div>

  <div className="collection-tabs">

    <button
    className="collection-tab active"
    type="button"
    onMouseEnter={() => setSidebarView("collections")}
    onClick={onCreateCollection}
>
    NEW
</button>

    <button
    className="collection-tab"
    type="button"
    onMouseEnter={() => setSidebarView("collections")}
    onClick={onImportCollection}
>
    IMPORT
</button>

    <button
    className="collection-tab"
    type="button"
    onMouseEnter={() => setSidebarView("collections")}
    onClick={() => {
        alert("Please use Collection Menu (⋮) to export.");
    }}
>
    EXPORT
</button>

    <button
    className="collection-tab"
    type="button"
    onClick={() => setSidebarView("history")}
>
    HIST
</button>



    

    

    

  </div>
     {sidebarView === "collections" && (
  <nav className="collection-list" aria-label="Collections">
        {collections.map((collection) => (
          <div className="collection-group" key={collection.id}>
            <CollectionRow collection={collection} onToggle={() => onToggleCollection(collection.id)} onCreateRequest={() => onCreateRequest(collection.id)} onRename={() => onRenameCollection(collection.id)} onDuplicate={() => onDuplicateCollection(collection.id)} onDelete={() => onDeleteCollection(collection.id)} onExportCollection={() => onExportCollection(collection.id)} onImportIntoCollection={() => onImportIntoCollection(collection.id)} />
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
    )}

      

      {sidebarView === "history" && (
  <>
    <div className="sidebar-section-header history-section-header">
      <span>History</span>
    </div>

    <div className="history-controls">
  <input
    aria-label="Search history"
    className="history-search"
    placeholder="Search history"
    value={historySearch}
    onChange={(event) => onHistorySearchChange(event.target.value)}
  />

  <select
    aria-label="Filter history"
    className="history-filter"
    value={activeHistoryFilter}
    onChange={(event) => onHistoryFilterChange(event.target.value)}
  >
    <option value="All">All</option>
    <option value="GET">GET</option>
    <option value="POST">POST</option>
    <option value="PUT">PUT</option>
    <option value="PATCH">PATCH</option>
    <option value="DELETE">DELETE</option>
  </select>
</div>

<div className="history-section">
  {historyEntries.length === 0 ? (
    <div className="history-empty">
      No requests yet.
    </div>
  ) : (
    historyEntries.map((entry) => (
      <SidebarRow
        className="request-row history-row"
        key={entry.id}
        onClick={() => onRestoreHistoryEntry(entry)}
      >
        <MethodBadge method={entry.method} />

        <div>
          <span className="sidebar-row-title">
            {entry.name}
          </span>

          <span className="history-meta">
            {new Date(entry.timestamp).toLocaleString()} • {entry.statusCode ?? "—"} • {entry.environment?.name ?? "Default"}
          </span>
        </div>

        <button
          className={`history-favorite ${entry.favorite ? "active" : ""}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleHistoryFavorite(entry.id)
          }}
        >
          {entry.favorite ? "★" : "☆"}
        </button>

        <ActionMenu
          label="History actions"
          actions={[
            {
              label: "Restore",
              onClick: () => onRestoreHistoryEntry(entry),
            },
            {
              label: "Rename",
              onClick: () => onRenameHistoryEntry(entry.id),
            },
            {
              label: "Duplicate",
              onClick: () => onDuplicateHistoryEntry(entry.id),
            },
            {
              label: "Delete",
              onClick: () => onDeleteHistoryEntry(entry.id),
              destructive: true,
            },
          ]}
        />
      </SidebarRow>
    ))
  )}
</div>

    {historyEntries.length > 0 && (
      <button
        className="clear-history-button"
        type="button"
        onClick={onClearHistory}
      >
        Clear History
      </button>
    )}
  </>
)}
    </aside>
  )
}

export default Sidebar
