export function findNode(root, id) {
  if (!root || !id) return null
  if (root.id === id) return root
  if (!Array.isArray(root.children)) return null

  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findCollection(collections, collectionId) {
  if (!Array.isArray(collections)) return null
  return collections.find((collection) => collection.id === collectionId) ?? null
}

export function collectRequests(node) {
  if (!node) return []
  if (node.type === 'request') return [node]

  if (!Array.isArray(node.children)) return []

  return node.children.flatMap(collectRequests)
}

export function getNodePath(root, targetId, path = []) {
  if (!root) return null

  const nextPath = [...path, root]
  if (root.id === targetId) return nextPath

  if (!Array.isArray(root.children)) return null

  for (const child of root.children) {
    const found = getNodePath(child, targetId, nextPath)
    if (found) return found
  }

  return null
}

export function resolveRunnerRequests({
  collections,
  collectionId,
  nodeId,
  scope,
}) {
  const collection = findCollection(collections, collectionId)
  if (!collection) {
    throw new Error('Collection not found.')
  }

  let node = collection

  if (scope !== 'collection') {
    node = findNode(collection, nodeId)
  }

  if (!node) {
    throw new Error('Runner target not found.')
  }

  const requests =
    scope === 'request'
      ? node.type === 'request'
        ? [node]
        : []
      : collectRequests(node)

  if (!requests.length) {
    throw new Error('No requests found in the selected runner target.')
  }

  return {
    collection,
    node,
    requests,
    path: getNodePath(collection, node.id) ?? [collection],
  }
}
