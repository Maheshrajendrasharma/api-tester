import React from 'react'

function RunnerTreeNode({ node, selectedId, onSelect, level = 0 }) {
  if (!node) return null

  const isRequest = node.type === 'request'
  const isSelected = selectedId === node.id

  return (
    <div>
      <button
        type="button"
        className={`runner-tree-row ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${12 + level * 18}px` }}
        onClick={() => onSelect(node)}
      >
        <span className="runner-tree-icon">
          {isRequest ? '▣' : node.type === 'collection' ? '▤' : '▰'}
        </span>
        <span className="runner-tree-name">
          {node.name || (isRequest ? 'New Request' : 'Unnamed')}
        </span>
        {isRequest && (
          <span className="runner-tree-method">
            {node.method || 'GET'}
          </span>
        )}
      </button>

      {!isRequest && Array.isArray(node.children) && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <RunnerTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function RunnerTree({ collections = [], selectedId, onSelect }) {
  return (
    <div className="runner-tree">
      {collections.map((collection) => (
        <RunnerTreeNode
          key={collection.id}
          node={collection}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
