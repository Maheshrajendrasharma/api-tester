import { useCallback, useMemo, useState } from 'react'

import {
  createFolderNode,
  createRequestNode,
} from '../models/collectionNode'

import {
  findNode,
  findParent,
  removeNode,
  insertNode,
  moveNode,
} from '../utils/treeHelpers'



function updateNodeInTree(node, id, changes) {
  if (!node) {
    return node
  }

  if (node.id === id) {
    return {
      ...node,
      ...changes,
    }
  }

  if (!Array.isArray(node.children)) {
    return node
  }

  let changed = false

  const children = node.children.map((child) => {
    const updated = updateNodeInTree(child, id, changes)

    if (updated !== child) {
      changed = true
    }

    return updated
  })

  return changed
    ? {
        ...node,
        children,
      }
    : node
}



export function useCollectionTree(initialCollection) {
  const [collection, setCollection] = useState(initialCollection)
  const [selectedRequestId, setSelectedRequestId] = useState(null)


  /*
   * ----------------------------------------
   * Selected request
   * ----------------------------------------
   */
const selectedRequest = useMemo(() => {
  if (!collection || !selectedRequestId) {
    return null
  }

  return findNode(collection, selectedRequestId)
}, [collection, selectedRequestId])


  /*
   * ----------------------------------------
   * Select request
   * ----------------------------------------
   */

  const selectRequest = useCallback((requestId) => {
    setSelectedRequestId(requestId)
  }, [])


  /*
   * ----------------------------------------
   * Update request
   * ----------------------------------------
   */

const updateRequest = useCallback((requestId, changes) => {
  setCollection((current) => {
    if (!current) {
      return current
    }

    return updateNodeInTree(current, requestId, changes)
  })
}, [])

  /*
   * ----------------------------------------
   * Create folder
   * ----------------------------------------
   */

  const addFolder = useCallback((parentId = null, name = 'New Folder') => {
    const folder = createFolderNode(name)

    setCollection((current) => {
      if (!current) {
        return current
      }

      if (!parentId || parentId === current.id) {
        return {
          ...current,
          children: [
            ...(current.children ?? []),
            folder,
          ],
        }
      }

     return insertNode(
  current,
  parentId,
  folder
)
    })

    return folder.id
  }, [])


  /*
   * ----------------------------------------
   * Create request
   * ----------------------------------------
   */

  const addRequest = useCallback(
  (parentId = null, request = null) => {
    const requestNode = createRequestNode(
      request ?? {
        id: crypto.randomUUID(),
        name: 'New Request',
        method: 'GET',
        url: '',
        params: [],
        headers: [],
        authorization: {},
        body: '',
        scripts: {
          preRequest: '',
          postResponse: '',
        },
      }
    )

    setCollection((current) => {
      if (!current) {
        return current
      }

      const targetId = parentId || current.id

      return insertNode(
        current,
        targetId,
        requestNode
      )
    })

    setSelectedRequestId(requestNode.id)

    return requestNode.id
  },
  []
)


  /*
   * ----------------------------------------
   * Delete node
   * ----------------------------------------
   */

  const deleteNode = useCallback((nodeId) => {
    setCollection((current) => {
      if (!current) {
        return current
      }

      return removeNode(
  current,
  nodeId
).tree
    })

    setSelectedRequestId((current) => {
      return current === nodeId
        ? null
        : current
    })
  }, [])


  /*
   * ----------------------------------------
   * Move node
   * ----------------------------------------
   */

  const moveTreeNode = useCallback(
  (nodeId, destinationFolderId, index = null) => {
    setCollection((current) => {
      if (!current) {
        return current
      }

      return moveNode(
        current,
        nodeId,
        destinationFolderId,
        index
      )
    })
  },
  []
)


  /*
   * ----------------------------------------
   * Find parent
   * ----------------------------------------
   */

  const getParent = useCallback(
    (nodeId) => {
      if (!collection) {
        return null
      }

     return findParent(
  collection,
  nodeId
)
    },
    [collection]
  )


 return {
  collection,
  setCollection,

  selectedRequest,
  selectedRequestId,

  selectRequest,

  updateRequest,

  addFolder,
  addRequest,

  deleteNode,

  moveNode: moveTreeNode,

  getParent,
}

}