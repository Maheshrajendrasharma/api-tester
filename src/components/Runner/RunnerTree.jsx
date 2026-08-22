import React from 'react'


function RunnerTreeNode({

  node,

  selectedId,

  executionMap = {},

  onSelect,

  level = 0

}) {


  if (!node) return null


  const isRequest = node.type === 'request'

  const isSelected = selectedId === node.id

  const executionStatus =
executionMap[node.id]?.status

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
          paddingLeft: `${12 + level * 18}px`
        }}

        onClick={() => onSelect(node)}

      >



        <span className="runner-tree-icon">

          {
            isRequest
              ? 'POST'
              : node.type === 'collection'
                ? '📁'
                : '📂'
          }

        </span>



<span className="runner-tree-name">

 {node.name}

</span>


{
 executionStatus &&

 <span className="runner-status">

   {executionStatus}

 </span>

}



        {
          isRequest && (

            <span className="runner-tree-method">

              {node.method || 'GET'}

            </span>

          )
        }


      </div>




      {
        !isRequest &&
        Array.isArray(node.children) &&
        node.children.length > 0 && (


          <div>

            {
              node.children.map((child) => (

                <RunnerTreeNode

  key={child.id}

  node={child}

  selectedId={selectedId}

  executionMap={executionMap}

  onSelect={onSelect}

  level={level + 1}

/>

              ))
            }


          </div>


        )
      }


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


      {
        collections.map((collection) => (


          <RunnerTreeNode

            key={collection.id}

            node={collection}

            selectedId={selectedId}

            onSelect={onSelect}

          />


        ))
      }


    </div>

  )

}