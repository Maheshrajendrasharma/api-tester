import ActionMenu from './ActionMenu'
import SidebarRow from './SidebarRow'

function CollectionRow({ collection, onToggle, onCreateRequest, onRename, onDuplicate, onDelete, onExportCollection, onImportIntoCollection }) {
  return (
    <SidebarRow className="collection-row" onClick={onToggle}>
      <button className="collection-toggle" type="button" onClick={(event) => { event.stopPropagation(); onToggle() }} aria-label={`${collection.expanded ? 'Collapse' : 'Expand'} ${collection.name}`} data-tooltip={collection.expanded ? 'Collapse Collection' : 'Expand Collection'}>{collection.expanded ? '⌄' : '›'}</button>
      <span className="collection-folder" aria-hidden="true">▰</span>
      <span className="sidebar-row-title">{collection.name}</span>
      <ActionMenu label="Collection actions" actions={[
        { label: 'New Request', onClick: onCreateRequest },
        { label: 'New Folder', onClick: () => {}, disabled: true, tooltip: 'Coming Soon' },
        { label: 'Rename', onClick: onRename },
        { label: 'Duplicate', onClick: onDuplicate },
        { label: 'Export Collection', onClick: onExportCollection },
        { label: 'Import into Collection', onClick: onImportIntoCollection },
        { label: 'Delete', onClick: onDelete, destructive: true },
        { label: 'Properties', onClick: () => {}, disabled: true, tooltip: 'Coming Soon' },
      ]} />
    </SidebarRow>
  )
}

export default CollectionRow
