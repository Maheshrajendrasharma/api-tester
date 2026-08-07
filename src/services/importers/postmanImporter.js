import {
  createCollectionNode,
  createFolderNode,
  createRequestNode,
} from '../../models/collectionNode'

import { importPostmanRequest } from '../postmanRequestImporter'


function buildItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      // ------------------------------------
      // Folder
      // ------------------------------------

      if (Array.isArray(item.item)) {
        const folder = createFolderNode(
          item.name || 'New Folder'
        )

        folder.children = buildItems(item.item)

        return folder
      }


      // ------------------------------------
      // Request
      // ------------------------------------

      if (item.request || item.name) {
        const request = importPostmanRequest(item)

        return createRequestNode(request)
      }

      return null
    })
    .filter(Boolean)
}


export function importPostmanCollection(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid Postman collection.')
  }

  const collection = createCollectionNode(
    raw.info?.name || 'Imported Collection'
  )

  collection.children = buildItems(
    raw.item
  )

  return collection
}