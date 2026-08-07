import {
  createCollectionNode,
  createFolderNode,
  createRequestNode,
} from '../models/collectionNode'

import { importPostmanRequest } from '../services/postmanRequestImporter'


function sanitizeName(value, fallback = 'Unnamed') {
  const name = String(value ?? '').trim()

  return name || fallback
}


/*
 * Convert a Postman item into our internal tree node.
 *
 * Postman folder:
 *
 * {
 *   name: "Payments",
 *   item: [...]
 * }
 *
 * becomes:
 *
 * {
 *   type: "folder",
 *   name: "Payments",
 *   children: [...]
 * }
 */
function buildPostmanItem(item) {
  if (!item || typeof item !== 'object') {
    return null
  }


  // -----------------------------------------
  // FOLDER
  // -----------------------------------------

  if (Array.isArray(item.item)) {
    const folder = createFolderNode(
      sanitizeName(item.name, 'New Folder')
    )

    folder.children = item.item
      .map((child) => buildPostmanItem(child))
      .filter(Boolean)

    return folder
  }


  // -----------------------------------------
  // REQUEST
  // -----------------------------------------

  if (item.request || item.name) {
    const request = importPostmanRequest(item)

    return createRequestNode(request)
  }


  return null
}


/*
 * Convert a complete Postman collection
 * into our internal tree.
 */
export function buildTreeFromPostman(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid Postman collection.')
  }


  const collectionName = sanitizeName(
    raw.info?.name,
    'Imported Collection'
  )


  const collection = createCollectionNode(
    collectionName
  )


  const items = Array.isArray(raw.item)
    ? raw.item
    : []


  collection.children = items
    .map((item) => buildPostmanItem(item))
    .filter(Boolean)


  return collection
}


/*
 * Build a tree from an API Tester
 * collection that is already in the new format.
 */
export function buildTreeFromApiTester(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid API Tester collection.')
  }


  const collection = createCollectionNode(
    sanitizeName(raw.name, 'My Collection')
  )


  function convertNode(node) {
    if (!node || typeof node !== 'object') {
      return null
    }


    // Request
    if (node.type === 'request') {
      return createRequestNode(node)
    }


    // Folder
    if (node.type === 'folder') {
      const folder = createFolderNode(
        sanitizeName(node.name, 'New Folder')
      )

      folder.id = node.id ?? folder.id

      folder.expanded =
        node.expanded !== false


      folder.children = Array.isArray(node.children)
        ? node.children
            .map((child) => convertNode(child))
            .filter(Boolean)
        : []


      return folder
    }


    return null
  }


  collection.id = raw.id ?? collection.id

  collection.expanded =
    raw.expanded !== false


  collection.children = Array.isArray(raw.children)
    ? raw.children
        .map((child) => convertNode(child))
        .filter(Boolean)
    : []


  return collection
}