import React, { useEffect, useRef, useState } from 'react'

  import {
  findNode,
  findParent,
} from '../utils/treeHelpers'

  import ActionMenu from './ActionMenu'
  import MethodBadge from './MethodBadge'
  import SidebarRow from './SidebarRow'



function NewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        d="M12 4v11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 20h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        d="M4 12a8 8 0 1 0 2.3-5.65"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M4 5v5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 8v4l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}



function CollectionsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}


function EnvironmentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="9"
        cy="9"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M13 9h4M8 13h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}




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
    onMoveNode,
      onDragStart,
      onRunNode,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,

  dropTargetId,
  dropPosition,
  }) {
    return (
<SidebarRow
  className={`request-row tree-request-row ${
    dropTargetId === request.id
      ? `drop-${dropPosition}`
      : ''
  }`}
  draggable
  onDragStart={(event) =>
    onDragStart(event, request)
  }
  onDragEnd={onDragEnd}
  onDragOver={(event) =>
    onDragOver(event, request)
  }
  onDragLeave={onDragLeave}
  onDrop={(event) =>
    onDrop(event, request)
  }
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
   collectionId,
  selectedRequestId,
    onMoveNode,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRunNode,
  dropTargetId,
  dropPosition,
  draggedNodeId,  
  onSelectRequest,

  onRenameCollection,
  onDuplicateCollection,
  onDeleteCollection,

  onRenameRequest,
  onDuplicateRequest,
  onDeleteRequest,
  onExportCollection,

  onCreateRequest,
  onToggleNode,

  onCreateFolder,
  onRenameFolder,
  onDuplicateFolder,
  onExportFolder,
  onDeleteFolder,

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
          onRunNode={onRunNode}

           onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}

    dropTargetId={dropTargetId}
    dropPosition={dropPosition}


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
  className={`tree-node-row ${
    dropTargetId === node.id
      ? 'drop-inside'
      : ''
  }`}
  draggable={!isCollection}
  onDragStart={(event) => {
    if (!isCollection) {
      onDragStart(event, node)
    }
  }}
  onDragEnd={onDragEnd}
  onDragOver={(event) =>
    onDragOver(event, node)
  }
  onDragLeave={onDragLeave}
  onDrop={(event) =>
    onDrop(event, node)
  }
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
  onClick: () =>
    onCreateRequest?.(node.id),
},

...(onCreateFolder
  ? [
      {
  label: 'New Folder',
  onClick: () =>
    onCreateFolder?.(
      isCollection ? collectionId : node.id
    ),
},
    ]
  : []),

    ...(isCollection
      ? [
        {
label: 'Run',
onClick: () => {

  console.log("SIDEBAR RUN CLICK", {
    collectionId,
    nodeId: node.id,
    onRunNodeExists: !!onRunNode
  })

  onRunNode?.(
    collectionId,
    node.id
  )
}},
          {
            label: 'Rename',
            onClick: () => onRenameCollection?.(node.id),
          },
          {
            label: 'Duplicate',
            onClick: () => onDuplicateCollection?.(node.id),
          },
          {
            label: 'Export Collection',
            onClick: () => onExportCollection?.(node.id),
          },
          {
            label: 'Delete',
            onClick: () => onDeleteCollection?.(node.id),
            destructive: true,
          },
        ]
      : []),

    ...(isFolder
      ? [
      {
        label: 'Run',
        onClick: () =>
          onRunNode?.(node.id),
      },

          {
            label: 'Rename',
            onClick: () => onRenameFolder?.(node.id),
          },
          {
            label: 'Duplicate',
            onClick: () => onDuplicateFolder?.(node.id),
          },
          {
            label: 'Export',
            onClick: () => onExportFolder?.(node.id),
          },
          {
            label: 'Delete',
            onClick: () => onDeleteFolder?.(node.id),
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
  collectionId={collectionId}
    selectedRequestId={selectedRequestId}
    onSelectRequest={onSelectRequest}
    onExportCollection={onExportCollection}
    onRunNode={onRunNode}

      onMoveNode={onMoveNode}

  onDragStart={onDragStart}
  onDragEnd={onDragEnd}
  onDragOver={onDragOver}
  onDragLeave={onDragLeave}
  onDrop={onDrop}
  

  dropTargetId={dropTargetId}
  dropPosition={dropPosition}
  draggedNodeId={draggedNodeId}

    onRenameCollection={onRenameCollection}
    onDuplicateCollection={onDuplicateCollection}
    onDeleteCollection={onDeleteCollection}
    onCreateFolder={onCreateFolder}

    onRenameRequest={onRenameRequest}
    onDuplicateRequest={onDuplicateRequest}
    onDeleteRequest={onDeleteRequest}

    onCreateRequest={onCreateRequest}
    onToggleNode={onToggleNode}



onDuplicateFolder={onDuplicateFolder}

onRenameFolder={onRenameFolder}



onExportFolder={onExportFolder}

onDeleteFolder={onDeleteFolder}
collectio0nId={collectionId} 

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
    label: 'Run',
    onClick: () =>
      onRunNode?.(request.id),
  },
    {
      label: 'View Request',
      onClick: () =>
        onRestoreHistoryEntry(entry),
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

    // src/components/Sidebar.jsx// ... (other imports)

function EnvironmentView({
  environments = [],
  activeEnvironmentId,
  onSelectEnvironment,
}) {
  return (
    <div className="sidebar-environments">

      <div className="sidebar-environment-header">
        ENVIRONMENTS
      </div>

      <div className="sidebar-environment-list">

        {environments.length === 0 ? (
          <div className="sidebar-environment-empty">
            No environments
          </div>
        ) : (
          environments.map((environment) => (
            <button
              key={environment.id}
              type="button"
              className={`sidebar-environment-row ${
                environment.id === activeEnvironmentId
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                onSelectEnvironment?.(environment.id)
              }
            >

              <EnvironmentIcon />

              <span>
                {environment.name || 'Unnamed Environment'}
              </span>

              {environment.id === activeEnvironmentId && (
                <span className="sidebar-environment-check">
                  ✓
                </span>
              )}

            </button>
          ))
        )}

      </div>

    </div>
  )
}


function CollectionsNavIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5h14v3H5z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 10h14v3H5z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 15h14v3H5z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}


function EnvironmentNavIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 4v16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M4 12h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}


function HistoryNavIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 12a8 8 0 1 0 2.3-5.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M4 5v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}


function Sidebar({
  
  collections,
  selectedRequestId,
  onCreateCollection,
  onToggleEnvironmentPanel,
  onCreateFolder,
  onImportCollection,
  onRenameFolder,
  onDuplicateFolder,
  onExportFolder,
  onDeleteFolder,
  onExportCollection,
  onImportIntoCollection,
  onRunNode,
  onCreateRequest,
  onSelectRequest,
  onToggleCollection,
  onRenameCollection,
  onDuplicateCollection,
  onDeleteCollection,
  onRenameRequest,
  onDuplicateRequest,
  onDeleteRequest,
  onMoveNode,

  historyEntries,
  favorites,
  historySearch,
  activeHistoryFilter,
  onHistorySearchChange,
  onHistoryFilterChange,
  onRestoreHistoryEntry,
  onDeleteHistoryEntry,
  onToggleHistoryFavorite,
  onClearHistory
  
}) {
      const [sidebarView, setSidebarView] =
        useState('collections')

const [collectionSearchOpen, setCollectionSearchOpen] =
  useState(false)

const [collectionSearch, setCollectionSearch] =
  useState('')

const collectionSearchInputRef = useRef(null)


useEffect(() => {
  if (
    collectionSearchOpen &&
    collectionSearchInputRef.current
  ) {
    collectionSearchInputRef.current.focus()
  }
}, [collectionSearchOpen])


    /*
    * Track expansion locally only when needed.
    *
    * Imported Postman collections already have their
    * `expanded` property. This state allows folders to
    * be opened/closed without changing the data model.
    */

    const [draggedNodeId, setDraggedNodeId] =
  useState(null)

const [dropTargetId, setDropTargetId] =
  useState(null)

const [dropPosition, setDropPosition] =
  useState(null)

function toggleNode(nodeId) {

    if (!nodeId) {
        return
    }

    onToggleCollection?.(nodeId)
}


  function filterTreeForSearch(node, searchText) {
  if (!node) {
    return null
  }

  const query = searchText.trim().toLowerCase()

  // Search is not active
  if (!query) {
    return node
  }

  // ============================================
  // REQUEST
  // SEARCH ONLY REQUEST NAME
  // ============================================

  if (node.type === 'request') {
    const requestName =
      String(node.name ?? '').toLowerCase()

    const matches =
      requestName.includes(query)

    if (!matches) {
      return null
    }

    return {
      ...node,
      expanded: true,
    }
  }

  // ============================================
  // COLLECTION / FOLDER
  // ============================================

  const children = Array.isArray(node.children)
    ? node.children
    : []

  const matchingChildren = children
    .map((child) =>
      filterTreeForSearch(
        child,
        searchText
      )
    )
    .filter(Boolean)

  // Nothing inside this folder/collection matched
  if (matchingChildren.length === 0) {
    return null
  }

  // Keep parent and automatically expand it
  return {
    ...node,
    expanded: true,
    children: matchingChildren,
  }
}


function getCollectionsForDisplay() {
  if (!collectionSearch.trim()) {
    return collections
  }

  return collections
    .map((collection) => {
      const normalized =
        normalizeCollectionForDisplay(collection)

      return filterTreeForSearch(
        normalized,
        collectionSearch
      )
    })
    .filter(Boolean)
}


   function handleDragStart(event, node) {
  if (!node || node.type === 'collection') {
    return
  }

  setDraggedNodeId(node.id)

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(
    'text/plain',
    node.id
  )
}

function handleDragEnd() {
  setDraggedNodeId(null)
  setDropTargetId(null)
  setDropPosition(null)
}

function handleDragOver(
  event,
  node
) {
  if (
    !node ||
    node.type === 'collection' ||
    !draggedNodeId ||
    node.id === draggedNodeId
  ) {
    return
  }

  event.preventDefault()

  event.dataTransfer.dropEffect = 'move'

  /*
   * Folder:
   * dropping on it means move INSIDE it.
   */
  if (node.type === 'folder') {
    setDropTargetId(node.id)
    setDropPosition('inside')
    return
  }

  /*
   * Request:
   * dropping above/below it means reorder
   * at the request's existing level.
   */
  if (node.type === 'request') {
    const rect =
      event.currentTarget.getBoundingClientRect()

    const middle =
      rect.top + rect.height / 2

    const position =
      event.clientY < middle
        ? 'before'
        : 'after'

    setDropTargetId(node.id)
    setDropPosition(position)
  }
}

function handleDragLeave(event) {
  /*
   * Only clear when leaving the actual row.
   */
  if (
    event.currentTarget ===
    event.relatedTarget
  ) {
    return
  }

  setDropTargetId(null)
  setDropPosition(null)
}

function handleDrop(
  event,
  collectionId,
  targetNode
) {
  event.preventDefault()
  event.stopPropagation()

  const sourceNodeId =
    event.dataTransfer.getData(
      'text/plain'
    ) || draggedNodeId

  if (
    !sourceNodeId ||
    !targetNode ||
    sourceNodeId === targetNode.id
  ) {
    handleDragEnd()
    return
  }

  const collection =
    collections.find(
      (item) =>
        item.id === collectionId
    )

  if (!collection) {
    handleDragEnd()
    return
  }

  const sourceNode =
    findNode(
      collection,
      sourceNodeId
    )

  if (!sourceNode) {
    handleDragEnd()
    return
  }

  /*
   * ------------------------------------------------
   * DROP ON FOLDER
   * ------------------------------------------------
   *
   * Folder becomes the new parent.
   * The dragged item goes to the end of
   * that folder's children.
   */
  if (targetNode.type === 'folder') {
    const children =
      Array.isArray(
        targetNode.children
      )
        ? targetNode.children
        : []

    onMoveNode(
      collectionId,
      sourceNodeId,
      targetNode.id,
      children.length
    )

    handleDragEnd()
    return
  }

  /*
   * ------------------------------------------------
   * DROP ON REQUEST
   * ------------------------------------------------
   *
   * Request remains at the same hierarchy level.
   */
  if (targetNode.type === 'request') {
    const parent =
      findParent(
        collection,
        targetNode.id
      )

    if (!parent) {
      handleDragEnd()
      return
    }

    const targetIndex =
      parent.children?.findIndex(
        (child) =>
          child.id === targetNode.id
      )

    if (
      targetIndex === undefined ||
      targetIndex < 0
    ) {
      handleDragEnd()
      return
    }

    let destinationIndex =
      targetIndex

    if (
      dropPosition === 'after'
    ) {
      destinationIndex =
        targetIndex + 1
    }

    onMoveNode(
      collectionId,
      sourceNodeId,
      parent.id,
      destinationIndex
    )
  }

  handleDragEnd()
}

    /*
    * Convert old flat collections to a tree temporarily.
    *
    * This prevents old collections from crashing while
    * new Postman collections use `children`.
    */
function normalizeCollectionForDisplay(collection) {

    if (!collection) {
        return null
    }


    /*
     * =====================================================
     * NEW TREE FORMAT
     * =====================================================
     */

    if (
        Array.isArray(
            collection.children
        )
    ) {

        return {
            ...collection,

            type:
                collection.type ??
                'collection',

            expanded:
                collection.expanded !== false,

            children:
                collection.children.map(
                    (child) =>
                        normalizeTreeNode(
                            child
                        )
                ),
        }
    }


    /*
     * =====================================================
     * OLD COLLECTION FORMAT
     *
     * requests[]
     * folders[]
     * =====================================================
     */

    const requestChildren =
        Array.isArray(
            collection.requests
        )
            ? collection.requests.map(
                (request) => ({
                    ...request,
                    type: 'request',
                })
            )
            : []


    const folderChildren =
        Array.isArray(
            collection.folders
        )
            ? collection.folders.map(
                (folder) =>
                    normalizeOldFolder(
                        folder
                    )
            )
            : []


    return {

        ...collection,

        type: 'collection',

        expanded:
            collection.expanded !== false,

        children: [
            ...folderChildren,
            ...requestChildren,
        ],
    }
}


/*
 * =========================================================
 * NORMALIZE NEW TREE NODE
 * =========================================================
 */

function normalizeTreeNode(node) {

    if (!node) {
        return null
    }


    /*
     * REQUEST
     */

    if (
        node.type === 'request'
    ) {

        return {
            ...node,
            type: 'request',
        }
    }


    /*
     * FOLDER / COLLECTION
     */

    return {

        ...node,

        expanded:
            node.expanded !== false,

        children:
            Array.isArray(
                node.children
            )
                ? node.children.map(
                    normalizeTreeNode
                )
                : [],
    }
}


/*
 * =========================================================
 * NORMALIZE OLD FOLDER
 * =========================================================
 */

function normalizeOldFolder(folder) {

    if (!folder) {
        return null
    }


    const requestChildren =
        Array.isArray(
            folder.requests
        )
            ? folder.requests.map(
                (request) => ({
                    ...request,
                    type: 'request',
                })
            )
            : []


    const nestedFolders =
        Array.isArray(
            folder.folders
        )
            ? folder.folders.map(
                normalizeOldFolder
            )
            : []


    return {

        ...folder,

        type: 'folder',

        expanded:
            folder.expanded !== false,

        children: [
            ...nestedFolders,
            ...requestChildren,
        ],
    }
}


    function renderCollection(collection) {
  const treeCollection =
    collectionSearch.trim()
      ? collection
      : normalizeCollectionForDisplay(collection)

      if (!treeCollection) return null

      /*
      * Inject callbacks onto the node only for the
      * recursive renderer. These are non-persistent
      * UI properties and are NOT saved.
      */
      const node = {
        ...treeCollection,
      }

      /*
      * Make sure nested nodes get their current expansion
      * state.
      */
function prepareNode(currentNode) {

    if (!currentNode) {
        return null
    }


    return {

        ...currentNode,

        expanded:
            collectionSearch.trim()
                ? true
                : currentNode.expanded !== false,

        __onExportCollection:
            onExportCollection,

        __onRenameFolder:
            onRenameFolder,

        __onDeleteFolder:
            onDeleteFolder,

        __onDuplicateFolder:
            onDuplicateFolder,

        __onExportFolder:
            onExportFolder,

        __onDeleteFolder:
            onDeleteFolder,

        children:
            Array.isArray(
                currentNode.children
            )
                ? currentNode.children.map(
                    prepareNode
                )
                : [],
    }
}
      return (
<TreeNode
  key={collection.id}
  node={prepareNode(node)}
  collectionId={collection.id}
  selectedRequestId={selectedRequestId}
          onSelectRequest={(requestId) =>
            onSelectRequest(
              collection.id,
              requestId
            )
          }
          onRunNode={onRunNode}
          onRenameCollection={onRenameCollection}
          onDuplicateCollection={onDuplicateCollection}
          onDeleteCollection={onDeleteCollection}
          onExportCollection={onExportCollection}
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
          onMoveNode={onMoveNode}
onDragStart={handleDragStart}
onDragEnd={handleDragEnd}
onDragOver={handleDragOver}
onDragLeave={handleDragLeave}
onDrop={(event, targetNode) =>
  handleDrop(
    event,
    collection.id,
    targetNode
  )
}
dropTargetId={dropTargetId}
dropPosition={dropPosition}
draggedNodeId={draggedNodeId}
onCreateRequest={(parentId) =>
  onCreateRequest?.(
    parentId || collection.id
  )
}
onToggleNode={toggleNode}
onCreateFolder={(parentId) =>
  onCreateFolder(
    parentId || collection.id
  )
}
onRenameFolder={onRenameFolder}
onRunNode={onRunNode}

onDuplicateFolder={onDuplicateFolder}

onExportFolder={onExportFolder}

onDeleteFolder={onDeleteFolder}
        />
      )
    }
return (
  <div className="sidebar">

    {/* =========================================
        LEFT SIDEBAR NAVIGATION
        ========================================= */}
<div className="sidebar-navigation">

  {/* COLLECTIONS */}

  <button
    type="button"
    className={`sidebar-navigation-item ${
      sidebarView === 'collections'
        ? 'active'
        : ''
    }`}
    onClick={() =>
      setSidebarView('collections')
    }
    title="Collections"
    aria-label="Collections"
  >
    <CollectionsNavIcon />

    <span className="sidebar-navigation-label">
      Collections
    </span>
  </button>


  {/* ENVIRONMENT */}

  <button
    type="button"
    className="sidebar-navigation-item"
    onClick={() =>
      onToggleEnvironmentPanel?.()
    }
    title="Toggle Environment Panel"
    aria-label="Toggle Environment Panel"
  >
    <EnvironmentNavIcon />

    <span className="sidebar-navigation-label">
      Environment
    </span>
  </button>


  {/* HISTORY */}

  <button
    type="button"
    className={`sidebar-navigation-item ${
      sidebarView === 'history'
        ? 'active'
        : ''
    }`}
    onClick={() =>
      setSidebarView('history')
    }
    title="History"
    aria-label="History"
  >
    <HistoryNavIcon />

    <span className="sidebar-navigation-label">
      History
    </span>
  </button>

</div>

    {/* =========================================
        RIGHT SIDE SIDEBAR CONTENT
        ========================================= */}

    <div className="sidebar-content">


      {/* =========================================
          COLLECTION HEADER
          ========================================= */}

      {sidebarView === 'collections' && (

        <div className="sidebar-collection-header">

          {!collectionSearchOpen ? (

            <button
              type="button"
              className="sidebar-collection-search-trigger"
              title="Search requests"
              aria-label="Search requests"
              onClick={() => {
                setSidebarView('collections')
                setCollectionSearchOpen(true)
              }}
            >

              <span className="sidebar-search-icon">
                🔍
              </span>

              <span className="sidebar-collection-title">
                COLLECTIONS
              </span>

            </button>

          ) : (

            <div className="sidebar-search-container">

              <span className="sidebar-search-icon">
                🔍
              </span>

              <input
                ref={collectionSearchInputRef}
                type="text"
                className="sidebar-search-input"
                value={collectionSearch}
                onChange={(event) =>
                  setCollectionSearch(
                    event.target.value
                  )
                }
                placeholder="Search requests..."
                aria-label="Search requests"
              />

              <button
                type="button"
                className="sidebar-search-close"
                title="Close search"
                aria-label="Close search"
                onClick={() => {
                  setCollectionSearch('')
                  setCollectionSearchOpen(false)
                }}
              >
                ×
              </button>

            </div>

          )}


          {/* COLLECTION ACTIONS */}

          {!collectionSearchOpen && (

            <ActionMenu
              label="Collection actions"
              actions={[
                {
                  label: 'Import Collection',
                  onClick: () =>
                    onImportCollection?.(),
                },
              ]}
            />

          )}

        </div>

      )}


      {/* =========================================
          COLLECTION TREE
          ========================================= */}

      {sidebarView === 'collections' && (

        <div className="collections-tree">

          {getCollectionsForDisplay().length > 0 ? (

            getCollectionsForDisplay().map(
              renderCollection
            )

          ) : collectionSearch.trim() ? (

            <div className="sidebar-search-empty">
              No matching requests
            </div>

          ) : null}

        </div>

      )}


      {/* =========================================
          ENVIRONMENTS
          ========================================= */}

      {sidebarView === 'environments' && (

        <EnvironmentView
          environments={environments}
          activeEnvironmentId={
            activeEnvironmentId
          }
          onSelectEnvironment={
            onSelectEnvironment
          }
        />

      )}


      {/* =========================================
          HISTORY
          ========================================= */}

      {sidebarView === 'history' && (

        <HistoryView
          historyEntries={historyEntries}
          historySearch={historySearch}
          activeHistoryFilter={
            activeHistoryFilter
          }

          onHistorySearchChange={
            onHistorySearchChange
          }

          onHistoryFilterChange={
            onHistoryFilterChange
          }

          onRestoreHistoryEntry={
            onRestoreHistoryEntry
          }


          onDeleteHistoryEntry={
            onDeleteHistoryEntry
          }

          onToggleHistoryFavorite={
            onToggleHistoryFavorite
          }

          onClearHistory={
            onClearHistory
          }
        />

      )}

    </div>

  </div>
)
}

export default Sidebar