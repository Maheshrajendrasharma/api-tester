import React from 'react'


function RunnerTreeNode({
  node,
  selectedId,
  executionMap = {},
  onSelect,
  level = 0
}) {

  if (!node) return null

  const isRequest =
    node.type === 'request'

  const isSelected =
    selectedId === node.id

  const execution =
    executionMap[node.id] || {}

  const executionStatus =
    execution.status

  const hasResult =
    executionStatus === 'success' ||
    executionStatus === 'failed'


  return (

    <div>

      <div
        className={`
          runner-tree-row
          ${isSelected ? 'selected' : ''}
          ${executionStatus
            ? `status-${executionStatus}`
            : ''}
        `}
        style={{
          paddingLeft:
            `${12 + level * 18}px`
        }}
        onClick={() => onSelect(node)}
      >

        {/* ICON */}

        <span className="runner-tree-icon">

          {isRequest
            ? ''
            : node.type === 'collection'
              ? '📁'
              : '📂'}

        </span>


        {/* METHOD */}

        {isRequest && (

          <span className="runner-tree-method">

            {node.method || 'GET'}

          </span>

        )}


        {/* NAME */}

        <span className="runner-tree-name">

          {node.name}

        </span>


        {/* EXECUTION INFO */}

{isRequest && (

  <div className="runner-tree-execution">

    {/* ITERATION */}

    <span className="runner-tree-iteration">
      {execution.iteration != null
        ? `Iteration ${execution.iteration}`
        : '—'}
    </span>


    {/* STATUS */}

    {!executionStatus && (
      <span className="runner-tree-not-run">
        —
      </span>
    )}

    {executionStatus === 'running' && (
      <span className="runner-tree-execution-status running">
        ⏳ Running
      </span>
    )}

    {hasResult && (
      <span
        className={`
          runner-tree-execution-status
          ${executionStatus}
        `}
      >
        {executionStatus === 'success'
          ? '✓ Success'
          : '✕ Failed'}
      </span>
    )}


    {/* HTTP STATUS */}

    {hasResult && (
      <span
        className={`runner-tree-http-status ${executionStatus}`}
      >
        {execution.statusCode ?? '—'}
      </span>
    )}


    {/* RESPONSE TIME */}

    {hasResult && (
      <span className="runner-tree-response-time">
        {execution.responseTime != null
          ? `${execution.responseTime} ms`
          : '—'}
      </span>
    )}

  </div>

)}
      </div>


      {/* CHILDREN */}

      {!isRequest &&
        Array.isArray(node.children) &&
        node.children.length > 0 && (

          <div>

            {node.children.map((child) => (

              <RunnerTreeNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                executionMap={executionMap}
                onSelect={onSelect}
                level={level + 1}
              />

            ))}

          </div>

        )}

    </div>

  )
}


export default function RunnerTree({
  collections = [],
  selectedId,
  executionMap = {},
  onSelect
}) {

  return (

    <div className="runner-tree">

      {collections.map((collection) => (

        <RunnerTreeNode
          key={collection.id}
          node={collection}
          selectedId={selectedId}
          executionMap={executionMap}
          onSelect={onSelect}
        />

      ))}

    </div>

  )

}