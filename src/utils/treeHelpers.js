// Walk every node in the tree recursively.
export function walkTree(node, callback) {
  if (!node) return

  callback(node)

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => {
      walkTree(child, callback)
    })
  }
}


// Find a node anywhere inside the tree.
export function findNode(root, id) {
  if (!root || !id) return null

  if (root.id === id) {
    return root
  }

  if (!Array.isArray(root.children)) {
    return null
  }

  for (const child of root.children) {
    const found = findNode(child, id)

    if (found) {
      return found
    }
  }

  return null
}


// Find the parent of a node.
export function findParent(root, id, parent = null) {
  if (!root) return null

  if (root.id === id) {
    return parent
  }

  if (!Array.isArray(root.children)) {
    return null
  }

  for (const child of root.children) {
    const found = findParent(child, id, root)

    if (found) {
      return found
    }
  }

  return null
}


// Remove a node from the tree.
//
// Returns:
// {
//   tree: updated tree,
//   removedNode: removed node
// }
export function removeNode(root, id) {
  if (!root || !Array.isArray(root.children)) {
    return {
      tree: root,
      removedNode: null,
    }
  }

  const index = root.children.findIndex(
    (child) => child.id === id
  )

  if (index !== -1) {
    const removedNode = root.children[index]

    return {
      tree: {
        ...root,
        children: [
          ...root.children.slice(0, index),
          ...root.children.slice(index + 1),
        ],
      },
      removedNode,
    }
  }

  for (let index = 0; index < root.children.length; index += 1) {
    const child = root.children[index]

    const result = removeNode(child, id)

    if (result.removedNode) {
      const updatedChildren = [...root.children]

      updatedChildren[index] = result.tree

      return {
        tree: {
          ...root,
          children: updatedChildren,
        },
        removedNode: result.removedNode,
      }
    }
  }

  return {
    tree: root,
    removedNode: null,
  }
}


// Insert a node inside a parent.
export function insertNode(root, parentId, node, index = null) {
  if (!root) return root

  if (root.id === parentId) {
    const children = Array.isArray(root.children)
      ? [...root.children]
      : []

    const insertIndex =
      index === null
        ? children.length
        : Math.max(0, Math.min(index, children.length))

    children.splice(insertIndex, 0, node)

    return {
      ...root,
      children,
    }
  }

  if (!Array.isArray(root.children)) {
    return root
  }

  let changed = false

  const children = root.children.map((child) => {
    const updated = insertNode(child, parentId, node, index)

    if (updated !== child) {
      changed = true
    }

    return updated
  })

  return changed
    ? {
        ...root,
        children,
      }
    : root
}


// Move a node from one location to another.
export function moveNode(root, nodeId, newParentId, index = null) {
  if (!root) return root

  // Prevent moving a node into itself.
  if (nodeId === newParentId) {
    return root
  }

  const nodeToMove = findNode(root, nodeId)

  if (!nodeToMove) {
    return root
  }

  // Prevent moving a folder into one of its own children.
  if (nodeToMove.type !== 'request') {
    const descendant = findNode(nodeToMove, newParentId)

    if (descendant) {
      return root
    }
  }

  const removedResult = removeNode(root, nodeId)

  if (!removedResult.removedNode) {
    return root
  }

  return insertNode(
    removedResult.tree,
    newParentId,
    removedResult.removedNode,
    index
  )
}


// Deep clone a tree/node.
export function cloneNode(node) {
  if (!node) return null

  return {
    ...node,
    id: crypto.randomUUID(),
    children: Array.isArray(node.children)
      ? node.children.map((child) => cloneNode(child))
      : undefined,
  }
}


// Update one node without mutating the original tree.
export function updateNode(root, id, changes) {
  if (!root) return root

  if (root.id === id) {
    return {
      ...root,
      ...changes,
    }
  }

  if (!Array.isArray(root.children)) {
    return root
  }

  let changed = false

  const children = root.children.map((child) => {
    const updated = updateNode(child, id, changes)

    if (updated !== child) {
      changed = true
    }

    return updated
  })

  return changed
    ? {
        ...root,
        children,
      }
    : root
}


// Delete a node.
export function deleteNode(root, id) {
  return removeNode(root, id).tree
}


// Toggle folder expansion.
export function toggleExpanded(root, id) {
  const node = findNode(root, id)

  if (!node || node.type === 'request') {
    return root
  }

  return updateNode(root, id, {
    expanded: !node.expanded,
  })
}