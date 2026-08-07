import ActionMenu from './ActionMenu'

function FolderNode({
  folder,
  level = 0,
  selectedRequestId,
  onToggle,
  onCreateRequest,
  onCreateFolder,
  onRename,
  onDuplicate,
  onDelete,
  onSelectRequest,
}) {
  if (!folder) return null

  const children = Array.isArray(folder.children)
    ? folder.children
    : []

  return (
    <div className="folder-node">
      {/* FOLDER ROW */}
      <div
        className="sidebar-row folder-row"
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => onToggle?.(folder.id)}
      >
        <span className="tree-line">│</span>

        <span className="folder-expand">
          {folder.expanded ? '⌄' : '›'}
        </span>

        <span className="folder-icon">
          📁
        </span>

        <span className="sidebar-row-title">
          {folder.name || 'New Folder'}
        </span>

        <ActionMenu
          label={`${folder.name || 'Folder'} actions`}
          actions={[
            {
              label: 'New Request',
              onClick: () => onCreateRequest?.(folder.id),
            },
            {
              label: 'New Folder',
              onClick: () => onCreateFolder?.(folder.id),
            },
            {
              label: 'Rename',
              onClick: () => onRename?.(folder.id),
            },
            {
              label: 'Duplicate',
              onClick: () => onDuplicate?.(folder.id),
            },
            {
              label: 'Delete',
              onClick: () => onDelete?.(folder.id),
              destructive: true,
            },
          ]}
        />
      </div>

      {/* CHILDREN */}
      {folder.expanded && children.length > 0 && (
        <div className="folder-children">
          {children.map((child) => {
            if (child.type === 'folder') {
              return (
                <FolderNode
                  key={child.id}
                  folder={child}
                  level={level + 1}
                  selectedRequestId={selectedRequestId}
                  onToggle={onToggle}
                  onCreateRequest={onCreateRequest}
                  onCreateFolder={onCreateFolder}
                  onRename={onRename}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onSelectRequest={onSelectRequest}
                />
              )
            }

            if (child.type === 'request') {
              return (
                <div
                  key={child.id}
                  className={`sidebar-row request-row ${
                    selectedRequestId === child.id ? 'selected' : ''
                  }`}
                  style={{ paddingLeft: `${(level + 1) * 16}px` }}
                  onClick={() => onSelectRequest?.(child.id)}
                >
                  <span className="tree-line">│</span>

                  <span className="request-icon">
                    {child.method || 'GET'}
                  </span>

                  <span className="sidebar-row-title">
                    {child.name || 'New Request'}
                  </span>
                </div>
              )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}

export default FolderNode