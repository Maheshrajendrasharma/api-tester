import { useState } from 'react'

import ActionMenu from './ActionMenu'
import MethodBadge from './MethodBadge'
import SidebarRow from './SidebarRow'

function TreeGuide({ children }) {
  return (
    <div className="tree-node-children">
      {children}
    </div>
  )
}

function FolderIcon({ expanded }) {
  return (
    <span
      className="tree-folder-icon"
      aria-hidden="true"
    >
      {expanded ? '📂' : '📁'}
    </span>
  )
}

function ExpandIcon({ expanded }) {
  return (
    <span
      className="tree-expand-icon"
      aria-hidden="true"
    >
      {expanded ? '⌄' : '›'}
    </span>
  )
}

function RequestTreeRow({
  request,
  selectedRequestId,
  onSelectRequest,
  onRenameRequest,
  onDuplicateRequest,
  onDeleteRequest,
}) {
  return (
    <SidebarRow
      className="request-row tree-request-row"
      selected={selectedRequestId === request.id}
      onClick={() => onSelectRequest(request.id)}
    >
      <div className="tree-request-content">
        <MethodBadge method={request.method || 'GET'} />

        <span className="sidebar-row-title tree-request-name">
          {request.name || 'New Request'}
        </span>

        <div
          className="tree-row-actions"
          onClick={(event) => event.stopPropagation()}
        >
          <ActionMenu
            label="Request actions"
            actions={[
              {
                label: 'Rename',
                onClick: () => onRenameRequest(request.id),
              },
              {
                label: 'Duplicate',
                onClick: () => onDuplicateRequest(request.id),
              },
              {
                label: 'Delete',
                onClick: () => onDeleteRequest(request.id),
                destructive: true,
              },
            ]}
          />
        </div>
      </div>
    </SidebarRow>
  )
}

function TreeNode({
  node,
  selectedRequestId,
  onSelectRequest,
  onRenameCollection,
  onDuplicateCollection,
  onDeleteCollection,
  onRenameRequest,
  onDuplicateRequest,
  onDeleteRequest,
  onCreateRequest,
  onToggleNode,
  onCreateFolder,
}) {
  if (!node) return null

  /*
   * REQUEST
   */
  if (node.type === 'request') {
    return (
      <RequestTreeRow
        request={node}
        selectedRequestId={selectedRequestId}
        onSelectRequest={onSelectRequest}
        onRenameRequest={onRenameRequest}
        onDuplicateRequest={onDuplicateRequest}
        onDeleteRequest={onDeleteRequest}
      />
    )
  }

  /*
   * COLLECTION / FOLDER
   */

  const isCollection = node.type === 'collection'
  const isFolder = node.type === 'folder'

  const children = Array.isArray(node.children)
    ? node.children
    : []

  return (
    <div
      className={`tree-node ${
        isCollection
          ? 'tree-collection-node'
          : 'tree-folder-node'
      }`}
    >
      <div
        className="tree-node-row"
        onClick={() => onToggleNode(node.id)}
      >
        <ExpandIcon expanded={node.expanded !== false} />

        <FolderIcon expanded={node.expanded !== false} />

        <span className="sidebar-row-title tree-folder-name">
          {node.name || (isCollection ? 'My Collection' : 'New Folder')}
        </span>

        <div
          className="tree-row-actions"
          onClick={(event) => event.stopPropagation()}
        >
          <ActionMenu
            label={`${isCollection ? 'Collection' : 'Folder'} actions`}
            actions={[
              {
                label: 'New Request',
                onClick: () => onCreateRequest(node.id),
              },

              ...(onCreateFolder
                ? [
                    {
                      label: 'New Folder',
                      onClick: () => onCreateFolder(node.id),
                    },
                  ]
                : []),

              ...(isCollection
                ? [
                    {
                      label: 'Rename',
                      onClick: () => onRenameCollection(node.id),
                    },
                    {
                      label: 'Duplicate',
                      onClick: () => onDuplicateCollection(node.id),
                    },
                    {
                      label: 'Export Collection',
                      onClick: () => {
                        if (node.id) {
                          const handler = node.__onExportCollection
                          if (handler) handler(node.id)
                        }
                      },
                    },
                    {
                      label: 'Delete',
                      onClick: () => onDeleteCollection(node.id),
                      destructive: true,
                    },
                  ]
                : []),

              ...(isFolder
                ? [
                    {
                      label: 'Rename',
                      onClick: () => {
                        if (node.__onRenameFolder) {
                          node.__onRenameFolder(node.id)
                        }
                      },
                    },
                    {
                      label: 'Delete',
                      onClick: () => {
                        if (node.__onDeleteFolder) {
                          node.__onDeleteFolder(node.id)
                        }
                      },
                      destructive: true,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      {node.expanded !== false && children.length > 0 && (
        <TreeGuide>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedRequestId={selectedRequestId}
              onSelectRequest={onSelectRequest}
              onRenameCollection={onRenameCollection}
              onDuplicateCollection={onDuplicateCollection}
              onDeleteCollection={onDeleteCollection}
              onRenameRequest={onRenameRequest}
              onDuplicateRequest={onDuplicateRequest}
              onDeleteRequest={onDeleteRequest}
              onCreateRequest={onCreateRequest}
              onToggleNode={onToggleNode}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </TreeGuide>
      )}
    </div>
  )
}

function HistoryView({
  historyEntries,
  historySearch,
  activeHistoryFilter,
  onHistorySearchChange,
  onHistoryFilterChange,
  onRestoreHistoryEntry,
  onRenameHistoryEntry,
  onDuplicateHistoryEntry,
  onDeleteHistoryEntry,
  onToggleHistoryFavorite,
  onClearHistory,
}) {
  return (
    <>
      <div className="history-controls">
        <input
          aria-label="Search history"
          className="history-search"
          placeholder="Search history"
          value={historySearch || ''}
          onChange={(event) =>
            onHistorySearchChange(event.target.value)
          }
        />

        <select
          aria-label="Filter history"
          className="history-filter"
          value={activeHistoryFilter || 'All'}
          onChange={(event) =>
            onHistoryFilterChange(event.target.value)
          }
        >
          <option value="All">All</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div className="history-list">
        {(historyEntries || []).map((entry) => (
          <SidebarRow
            key={entry.id}
            className="history-row"
          >
            <div>
              <span className="sidebar-row-title">
                {entry.name}
              </span>

              <span className="history-meta">
                {new Date(entry.timestamp).toLocaleString()}
                {' • '}
                {entry.statusCode ?? '—'}
                {' • '}
                {entry.environment?.name ?? 'Default'}
              </span>
            </div>

            <button
              className={`history-favorite ${
                entry.favorite ? 'active' : ''
              }`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onToggleHistoryFavorite(entry.id)
              }}
            >
              {entry.favorite ? '★' : '☆'}
            </button>

            <ActionMenu
              label="History actions"
              actions={[
                {
                  label: 'Restore',
                  onClick: () =>
                    onRestoreHistoryEntry(entry),
                },
                {
                  label: 'Rename',
                  onClick: () =>
                    onRenameHistoryEntry(entry.id),
                },
                {
                  label: 'Duplicate',
                  onClick: () =>
                    onDuplicateHistoryEntry(entry.id),
                },
                {
                  label: 'Delete',
                  onClick: () =>
                    onDeleteHistoryEntry(entry.id),
                  destructive: true,
                },
              ]}
            />
          </SidebarRow>
        ))}
      </div>

      {(historyEntries || []).length > 0 && (
        <button
          className="clear-history-button"
          type="button"
          onClick={onClearHistory}
        >
          Clear History
        </button>
      )}
    </>
  )
}

function Sidebar({
  collections = [],
  selectedRequestId,

  onCreateCollection,
  onImportCollection,
  onExportCollection,
  onImportIntoCollection,

  onCreateRequest,
  onSelectRequest,

  onToggleCollection,

  onRenameCollection,
  onDuplicateCollection,
  onDeleteCollection,

  onRenameRequest,
  onDuplicateRequest,
  onDeleteRequest,

  historyEntries = [],
  historySearch,
  activeHistoryFilter,
  onHistorySearchChange,
  onHistoryFilterChange,
  onRestoreHistoryEntry,
  onRenameHistoryEntry,
  onDuplicateHistoryEntry,
  onDeleteHistoryEntry,
  onToggleHistoryFavorite,
  onClearHistory,

  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}) {
  const [sidebarView, setSidebarView] =
    useState('collections')

  /*
   * Track expansion locally only when needed.
   *
   * Imported Postman collections already have their
   * `expanded` property. This state allows folders to
   * be opened/closed without changing the data model.
   */
  const [expandedNodes, setExpandedNodes] = useState({})

  function toggleNode(nodeId) {
    if (!nodeId) return

    setExpandedNodes((current) => ({
      ...current,
      [nodeId]: current[nodeId] === false,
    }))

    /*
     * Keep compatibility with the existing collection
     * toggle callback.
     */
    if (onToggleCollection) {
      onToggleCollection(nodeId)
    }
  }

  function isNodeExpanded(node) {
    if (
      Object.prototype.hasOwnProperty.call(
        expandedNodes,
        node.id
      )
    ) {
      return expandedNodes[node.id]
    }

    return node.expanded !== false
  }

  /*
   * Convert old flat collections to a tree temporarily.
   *
   * This prevents old collections from crashing while
   * new Postman collections use `children`.
   */
  function normalizeCollectionForDisplay(collection) {
    if (!collection) return null

    if (Array.isArray(collection.children)) {
      return {
        ...collection,
        expanded: isNodeExpanded(collection),
      }
    }

    const requestChildren = Array.isArray(
      collection.requests
    )
      ? collection.requests.map((request) => ({
          ...request,
          type: 'request',
        }))
      : []

    const folderChildren = Array.isArray(
      collection.folders
    )
      ? collection.folders.map((folder) => ({
          ...folder,
          type: 'folder',
          children: [
            ...(Array.isArray(folder.requests)
              ? folder.requests.map((request) => ({
                  ...request,
                  type: 'request',
                }))
              : []),
          ],
        }))
      : []

    return {
      ...collection,
      type: 'collection',
      expanded: isNodeExpanded(collection),
      children: [
        ...folderChildren,
        ...requestChildren,
      ],
    }
  }

  function renderCollection(collection) {
    const treeCollection =
      normalizeCollectionForDisplay(collection)

    if (!treeCollection) return null

    /*
     * Inject callbacks onto the node only for the
     * recursive renderer. These are non-persistent
     * UI properties and are NOT saved.
     */
    const node = {
      ...treeCollection,
      __onExportCollection: onExportCollection,
      __onRenameFolder: onRenameFolder,
      __onDeleteFolder: onDeleteFolder,
    }

    /*
     * Make sure nested nodes get their current expansion
     * state.
     */
    function prepareNode(currentNode) {
      if (!currentNode) return null

      return {
        ...currentNode,
        expanded: isNodeExpanded(currentNode),
        __onExportCollection: onExportCollection,
        __onRenameFolder: onRenameFolder,
        __onDeleteFolder: onDeleteFolder,
        children: Array.isArray(currentNode.children)
          ? currentNode.children.map(prepareNode)
          : [],
      }
    }

    return (
      <TreeNode
        key={collection.id}
        node={prepareNode(node)}
        selectedRequestId={selectedRequestId}
        onSelectRequest={(requestId) =>
          onSelectRequest(
            collection.id,
            requestId
          )
        }
        onRenameCollection={onRenameCollection}
        onDuplicateCollection={onDuplicateCollection}
        onDeleteCollection={onDeleteCollection}
        onRenameRequest={(requestId) =>
          onRenameRequest(
            collection.id,
            requestId
          )
        }
        onDuplicateRequest={(requestId) =>
          onDuplicateRequest(
            collection.id,
            requestId
          )
        }
        onDeleteRequest={(requestId) =>
          onDeleteRequest(
            collection.id,
            requestId
          )
        }
        onCreateRequest={(parentId) =>
          onCreateRequest(
            parentId || collection.id
          )
        }
        onToggleNode={toggleNode}
        onCreateFolder={onCreateFolder}
      />
    )
  }

  return (
    <div className="sidebar">
      <div className="collection-tabs">
        <button
          className="collection-tab active"
          type="button"
          onMouseEnter={() =>
            setSidebarView('collections')
          }
          onClick={onCreateCollection}
        >
          NEW
        </button>

        <button
          className="collection-tab"
          type="button"
          onMouseEnter={() =>
            setSidebarView('collections')
          }
          onClick={onImportCollection}
        >
          IMPORT
        </button>

        <button
          className="collection-tab"
          type="button"
          onMouseEnter={() =>
            setSidebarView('collections')
          }
          onClick={() => {
            alert(
              'Please use Collection Menu (⋮) to export.'
            )
          }}
        >
          EXPORT
        </button>

        <button
          className="collection-tab"
          type="button"
          onClick={() =>
            setSidebarView('history')
          }
        >
          HIST
        </button>
      </div>

      {sidebarView === 'collections' && (
        <div className="collections-tree">
          {collections.map(renderCollection)}
        </div>
      )}

      {sidebarView === 'history' && (
        <HistoryView
          historyEntries={historyEntries}
          historySearch={historySearch}
          activeHistoryFilter={activeHistoryFilter}
          onHistorySearchChange={
            onHistorySearchChange
          }
          onHistoryFilterChange={
            onHistoryFilterChange
          }
          onRestoreHistoryEntry={
            onRestoreHistoryEntry
          }
          onRenameHistoryEntry={
            onRenameHistoryEntry
          }
          onDuplicateHistoryEntry={
            onDuplicateHistoryEntry
          }
          onDeleteHistoryEntry={
            onDeleteHistoryEntry
          }
          onToggleHistoryFavorite={
            onToggleHistoryFavorite
          }
          onClearHistory={onClearHistory}
        />
      )}
    </div>
  )
}

export default Sidebar