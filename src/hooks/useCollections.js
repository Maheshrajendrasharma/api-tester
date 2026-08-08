import { useEffect, useMemo, useState } from 'react'

import {
  loadCollections,
  saveCollections,
} from '../services/storageService'

import {
  buildRequestFromTemplate,
  duplicateRequestData,
} from '../services/collectionService'

import {
  exportCollection as exportCollectionData,
  importCollectionFromFile,
} from '../services/importExportService'

import { isDuplicateName } from '../utils/validators'

import {
  createCollection,
  createId,
  createRequest,
} from '../utils/requestModel'

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


/* =========================================================
   HELPERS
   ========================================================= */

function generateUniqueName(baseName, existingNames) {
  const cleanBase = String(baseName ?? 'New Request')
    .replace(/\sCopy(?:\s\d+)?$/, '')

  if (!existingNames.includes(cleanBase)) {
    return cleanBase
  }

  const firstCopy = `${cleanBase} Copy`

  if (!existingNames.includes(firstCopy)) {
    return firstCopy
  }

  let counter = 1

  while (
    existingNames.includes(`${cleanBase} Copy ${counter}`)
  ) {
    counter += 1
  }

  return `${cleanBase} Copy ${counter}`
}


/*
  Convert an old API Tester collection structure:

  collection
    requests[]
    folders[]

  into the new structure:

  collection
    children[]
      request
      folder
        children[]
*/
function convertCollectionToTree(collection) {
  if (!collection) {
    return collection
  }

  // Already converted
  if (Array.isArray(collection.children)) {
    return collection
  }

  const children = []

  /*
    Top-level requests
  */
  if (Array.isArray(collection.requests)) {
    collection.requests.forEach((request) => {
      children.push(
        createRequestNode(request)
      )
    })
  }

  /*
    Convert folders recursively
  */
  function convertFolder(folder) {
    const folderNode = {
      id: folder.id ?? createId(),
      type: 'folder',
      name: folder.name ?? 'Folder',
      expanded: folder.expanded ?? true,
      children: [],
    }

    if (Array.isArray(folder.requests)) {
      folder.requests.forEach((request) => {
        folderNode.children.push(
          createRequestNode(request)
        )
      })
    }

    if (Array.isArray(folder.folders)) {
      folder.folders.forEach((nestedFolder) => {
        folderNode.children.push(
          convertFolder(nestedFolder)
        )
      })
    }

    return folderNode
  }

  if (Array.isArray(collection.folders)) {
    collection.folders.forEach((folder) => {
      children.push(
        convertFolder(folder)
      )
    })
  }

  return {
    ...collection,
    type: 'collection',
    children,
    expanded: collection.expanded ?? true,
  }
}


/*
  Convert imported hierarchical Postman data.

  If the importer already returns children[],
  preserve it exactly.
*/
function normalizeImportedCollection(collection) {
  if (!collection) {
    return collection
  }

  if (Array.isArray(collection.children)) {
    return {
      ...collection,
      type: 'collection',
      expanded: true,
    }
  }

  return convertCollectionToTree(collection)
}


/*
  Get every request recursively.
*/
function getAllRequests(root) {
  if (!root) {
    return []
  }

  const requests = []

  function walk(node) {
    if (!node) return

    if (node.type === 'request') {
      requests.push(node)
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
    }
  }

  walk(root)

  return requests
}


/*
  Get every node recursively.
*/
function getAllNodes(root) {
  if (!root) {
    return []
  }

  const nodes = []

  function walk(node) {
    if (!node) return

    nodes.push(node)

    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
    }
  }

  walk(root)

  return nodes
}


/*
  Find a request across all collections.
*/
function findRequestInCollections(collections, requestId) {
  for (const collection of collections) {
    const found = findNode(collection, requestId)

    if (found?.type === 'request') {
      return found
    }
  }

  return null
}


/*
  Update a node recursively.
*/
function updateTreeNode(root, nodeId, changes) {
  if (!root) {
    return root
  }

  if (root.id === nodeId) {
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
    const updated = updateTreeNode(
      child,
      nodeId,
      changes
    )

    if (updated !== child) {
      changed = true
    }

    return updated
  })

  if (!changed) {
    return root
  }

  return {
    ...root,
    children,
  }
}


/*
  Delete node from a collection tree.
*/
function deleteNodeFromTree(root, nodeId) {
  return removeNode(root, nodeId).tree
}


/*
  Find the first request in a collection.
*/
function findFirstRequest(collection) {
  const requests = getAllRequests(collection)

  return requests[0] ?? null
}


/*
  Find collection containing request.
*/
function findCollectionContainingRequest(
  collections,
  requestId
) {
  return collections.find((collection) => {
    const node = findNode(
      collection,
      requestId
    )

    return node?.type === 'request'
  })
}


/* =========================================================
   MAIN HOOK
   ========================================================= */

export function useCollections({ onShowDialog } = {}) {
  const [collections, setCollections] = useState([])
  const [selectedRequestId, setSelectedRequestId] =
    useState(null)

  const [collectionsReady, setCollectionsReady] =
    useState(false)


  /* =======================================================
     LOAD
     ======================================================= */

  useEffect(() => {
    let isMounted = true

    async function restoreCollections() {
      try {
        const savedCollections =
          await loadCollections()

        const initialCollections =
          savedCollections.length
            ? savedCollections.map(
                convertCollectionToTree
              )
            : [
                convertCollectionToTree(
                  createCollection()
                ),
              ]

        if (isMounted) {
          setCollections(initialCollections)

          const firstRequest =
            findFirstRequest(
              initialCollections[0]
            )

          setSelectedRequestId(
            firstRequest?.id ?? null
          )
        }
      } catch {
        if (isMounted) {
          const initialCollection =
            convertCollectionToTree(
              createCollection()
            )

          setCollections([
            initialCollection,
          ])

          const firstRequest =
            findFirstRequest(
              initialCollection
            )

          setSelectedRequestId(
            firstRequest?.id ?? null
          )
        }
      } finally {
        if (isMounted) {
          setCollectionsReady(true)
        }
      }
    }

    restoreCollections()

    return () => {
      isMounted = false
    }
  }, [])


  /* =======================================================
     SAVE
     ======================================================= */

  useEffect(() => {
    if (collectionsReady) {
      saveCollections(collections)
        .catch(() => {})
    }
  }, [collections, collectionsReady])


  /* =======================================================
     SELECTED REQUEST
     ======================================================= */

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) {
      return null
    }

    return findRequestInCollections(
      collections,
      selectedRequestId
    )
  }, [
    collections,
    selectedRequestId,
  ])


  /* =======================================================
     DIALOG HELPERS
     ======================================================= */

  function showValidationError(message) {
    onShowDialog?.({
      open: true,
      type: 'confirm',
      title: 'Notice',
      message,
      initialValue: '',
      options: [],
      confirmLabel: 'OK',
      cancelLabel: '',
      onConfirm: () =>
        onShowDialog?.({
          open: false,
          type: 'confirm',
          title: '',
          message: '',
          initialValue: '',
          options: [],
          confirmLabel: 'OK',
          cancelLabel: '',
          onConfirm: null,
          onCancel: null,
        }),
      onCancel: () =>
        onShowDialog?.({
          open: false,
          type: 'confirm',
          title: '',
          message: '',
          initialValue: '',
          options: [],
          confirmLabel: 'OK',
          cancelLabel: '',
          onConfirm: null,
          onCancel: null,
        }),
    })
  }


  function promptForName(
    message,
    initialName,
    onComplete
  ) {
    onShowDialog?.({
      open: true,
      type: 'input',
      title: message,
      message: '',
      initialValue: initialName,
      options: [],
      confirmLabel: 'Save',
      cancelLabel: 'Cancel',

      onConfirm: (value) => {
        onShowDialog?.({
          open: false,
          type: 'input',
          title: '',
          message: '',
          initialValue: '',
          options: [],
          confirmLabel: 'Save',
          cancelLabel: '',
          onConfirm: null,
          onCancel: null,
        })

        const trimmed =
          String(value ?? '').trim()

        if (trimmed) {
          onComplete(trimmed)
        }
      },

      onCancel: () =>
        onShowDialog?.({
          open: false,
          type: 'input',
          title: '',
          message: '',
          initialValue: '',
          options: [],
          confirmLabel: 'Save',
          cancelLabel: '',
          onConfirm: null,
          onCancel: null,
        }),
    })
  }


  /* =======================================================
     CREATE COLLECTION
     ======================================================= */

  function createNewCollection() {
    const existingNames =
      collections.map(
        (collection) => collection.name
      )

    const name = generateUniqueName(
      'New Collection',
      existingNames
    )

    const collection =
      convertCollectionToTree(
        createCollection(name)
      )

    setCollections(
      (current) => [
        ...current,
        collection,
      ]
    )

    const firstRequest =
      findFirstRequest(collection)

    setSelectedRequestId(
      firstRequest?.id ?? null
    )
  }


  /* =======================================================
     IMPORT COLLECTION
     ======================================================= */

  async function importCollection() {
    const input =
      document.createElement('input')

    input.type = 'file'
    input.accept =
      '.json,application/json'

    input.onchange = async () => {
      const file =
        input.files?.[0]

      if (!file) return

      try {
        const importedCollection =
          await importCollectionFromFile(file)

        const treeCollection =
          normalizeImportedCollection(
            importedCollection
          )

        const defaultName =
          treeCollection.name ||
          file.name.replace(
            /\.json$/i,
            ''
          )

        promptForName(
          'Import collection as',
          defaultName,
          (name) => {
            const existingNames =
              collections.map(
                (collection) =>
                  collection.name
              )

            if (
              existingNames.includes(name)
            ) {
              showValidationError(
                'A collection with that name already exists.'
              )

              return
            }

            const collection = {
              ...treeCollection,
              id: createId(),
              type: 'collection',
              name,
              expanded: true,
            }

            setCollections(
              (currentCollections) => [
                ...currentCollections,
                collection,
              ]
            )

            const firstRequest =
              findFirstRequest(collection)

            setSelectedRequestId(
              firstRequest?.id ?? null
            )
          }
        )
      } catch (error) {
        showValidationError(
          error?.message ||
          'Import failed.'
        )
      }
    }

    input.click()
  }


  /* =======================================================
     EXPORT COLLECTION
     ======================================================= */

  async function exportCollection(
    collectionId = null
  ) {
    const collection =
      collections.find(
        (item) =>
          item.id === collectionId
      ) ??
      findCollectionContainingRequest(
        collections,
        selectedRequestId
      ) ??
      collections[0]

    if (!collection) {
      return
    }

    try {
      const content =
        await exportCollectionData(
          collection
        )

      const dialog =
        await window.apiTester
          ?.showSaveDialog?.({
            filters: [
              {
                name: 'JSON Files',
                extensions: ['json'],
              },
            ],
            defaultPath:
              `${collection.name}.json`,
          })

      if (
        !dialog ||
        dialog.canceled ||
        !dialog.filePath
      ) {
        return
      }

      await window.apiTester
        ?.writeFile?.(
          dialog.filePath,
          content
        )
    } catch (error) {
      showValidationError(
        error?.message ||
        'Export failed.'
      )
    }
  }


  /* =======================================================
     IMPORT INTO COLLECTION
     ======================================================= */

  async function importCollectionIntoCollection(
    collectionId
  ) {
    const targetCollection =
      collections.find(
        (collection) =>
          collection.id === collectionId
      )

    if (!targetCollection) {
      return
    }

    const input =
      document.createElement('input')

    input.type = 'file'
    input.accept =
      '.json,application/json'

    input.onchange = async () => {
      const file =
        input.files?.[0]

      if (!file) return

      try {
        const importedCollection =
          await importCollectionFromFile(file)

        const importedTree =
          normalizeImportedCollection(
            importedCollection
          )

        /*
          Import the entire hierarchy,
          not only requests.
        */

        const importedChildren =
          Array.isArray(
            importedTree.children
          )
            ? importedTree.children
            : []

        setCollections(
          (currentCollections) =>
            currentCollections.map(
              (collection) => {
                if (
                  collection.id !==
                  collectionId
                ) {
                  return collection
                }

                return {
                  ...collection,
                  expanded: true,
                  children: [
                    ...(collection.children ?? []),
                    ...importedChildren,
                  ],
                }
              }
            )
        )

        const firstRequest =
          findFirstRequest(
            importedTree
          )

        setSelectedRequestId(
          firstRequest?.id ?? null
        )
      } catch (error) {
        showValidationError(
          error?.message ||
          'Import failed.'
        )
      }
    }

    input.click()
  }


  /* =======================================================
     CREATE REQUEST
     ======================================================= */

function createNewRequest(parentId) {
  if (!parentId) {
    return null
  }

  // Find the collection containing the clicked
  // collection/folder at ANY hierarchy level.
  let parentCollection = null
  let parentNode = null

  for (const collection of collections) {
    const found = findNode(collection, parentId)

    if (found) {
      parentCollection = collection
      parentNode = found
      break
    }
  }

  if (!parentCollection || !parentNode) {
    return null
  }

  // Keep existing naming convention.
  const existingNames = getAllRequests(
    parentCollection
  ).map((request) => request.name)

  const name = generateUniqueName(
    'New Request',
    existingNames
  )

  const request = createRequestNode(
    createRequest(name)
  )

  setCollections((currentCollections) =>
    currentCollections.map((collectionItem) => {
      if (
        collectionItem.id !==
        parentCollection.id
      ) {
        return collectionItem
      }

      return insertNode(
        collectionItem,
        parentId,
        request
      )
    })
  )

  setSelectedRequestId(request.id)

  return request.id
}


  /* =======================================================
     SELECT REQUEST
     ======================================================= */

  function selectRequest(
    _collectionId,
    requestId
  ) {
    setSelectedRequestId(
      requestId
    )
  }


  /* =======================================================
     TOGGLE COLLECTION / FOLDER
     ======================================================= */

  function toggleCollection(
    nodeId
  ) {
    setCollections(
      (currentCollections) =>
        currentCollections.map(
          (collection) =>
            updateTreeNode(
              collection,
              nodeId,
              {
                expanded:
                  !findNode(
                    collection,
                    nodeId
                  )?.expanded,
              }
            )
        )
    )
  }


/* =======================================================
   DUPLICATE FOLDER
   ======================================================= */

function duplicateFolder(folderId) {
  let sourceFolder = null
  let parentId = null
  let collectionId = null

  function findParent(root, targetId, parent = null) {
    if (!root) return null

    if (root.id === targetId) {
      return parent
    }

    if (Array.isArray(root.children)) {
      for (const child of root.children) {
        const result = findParent(child, targetId, root)

        if (result) {
          return result
        }
      }
    }

    return null
  }

  for (const collection of collections) {
    const found = findNode(collection, folderId)

    if (found?.type === 'folder') {
      sourceFolder = found
      collectionId = collection.id
      parentId = findParent(collection, folderId)
      break
    }
  }

  if (!sourceFolder || !collectionId) return

  const existingNames = []

  function collectNames(node) {
    if (!node) return

    if (node.type === 'folder') {
      existingNames.push(node.name)
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(collectNames)
    }
  }

for (const collection of collections) {
  const found = findNode(collection, parentId)

  if (found) {
    parentCollection = collection
    parentNode = found
    break
  }
}

  collectNames(collection)

  const duplicateName = generateUniqueName(
    sourceFolder.name || 'New Folder',
    existingNames
  )

  function cloneNode(node) {
    return {
      ...node,
      id: createId(),
      name:
        node === sourceFolder
          ? duplicateName
          : node.name,
      children: Array.isArray(node.children)
        ? node.children.map(cloneNode)
        : [],
    }
  }

  const duplicate = cloneNode(sourceFolder)

  setCollections((currentCollections) =>
    currentCollections.map((collectionItem) => {
      if (collectionItem.id !== collectionId) {
        return collectionItem
      }

      const destinationId =
        parentId?.id || collectionId

      return insertNode(
        collectionItem,
        destinationId,
        duplicate
      )
    })
  )
}




/* =======================================================
   DELETE FOLDER
   ======================================================= */

function deleteFolder(folderId) {
  let folder = null

  for (const collection of collections) {
    folder = findNode(collection, folderId)

    if (folder?.type === 'folder') {
      break
    }

    folder = null
  }

  if (!folder) return

  promptForName(
    `Delete folder "${folder.name}"? Type DELETE to confirm.`,
    '',
    (value) => {
      if (
        String(value ?? '').trim().toLowerCase() !== 'delete'
      ) {
        return
      }

      setCollections((currentCollections) =>
        currentCollections.map((collection) =>
          deleteNodeFromTree(collection, folderId)
        )
      )
    }
  )
}



/* =======================================================
   RENAME FOLDER
   ======================================================= */

function renameFolder(folderId) {
  let folder = null

  for (const collection of collections) {
    folder = findNode(collection, folderId)

    if (folder?.type === 'folder') {
      break
    }

    folder = null
  }

  if (!folder) return

  promptForName(
    'Folder name',
    folder.name,
    (name) => {
      if (!name || !String(name).trim()) return

      setCollections((currentCollections) =>
        currentCollections.map((collection) =>
          updateTreeNode(collection, folderId, {
            name: String(name).trim(),
          })
        )
      )
    }
  )
}

  /* =======================================================
    EXPORT FOLDER
     ======================================================= */
async function exportFolder(folderId) {
  let folder = null

  for (const collection of collections) {
    const found = findNode(
      collection,
      folderId
    )

    if (found?.type === 'folder') {
      folder = found
      break
    }
  }

  if (!folder) {
    throw new Error('Folder not found.')
  }

  const postmanItems = []

  function convertNode(node) {
    if (!node) {
      return null
    }

    if (node.type === 'request') {
      return {
        name: node.name || 'New Request',
        request: {
          method: node.method || 'GET',
          header: Array.isArray(node.headers)
            ? node.headers
                .filter((header) => header.enabled !== false)
                .map((header) => ({
                  key: header.key || '',
                  value: header.value || '',
                }))
            : [],
          url: node.url || '',
          body: node.body
            ? {
                mode: 'raw',
                raw:
                  typeof node.body === 'string'
                    ? node.body
                    : JSON.stringify(node.body),
              }
            : undefined,
        },
      }
    }

    if (node.type === 'folder') {
      return {
        name: node.name || 'New Folder',
        item: Array.isArray(node.children)
          ? node.children
              .map(convertNode)
              .filter(Boolean)
          : [],
      }
    }

    return null
  }

  const folderItem = convertNode(folder)

  const content = JSON.stringify(
    {
      info: {
        name: folder.name || 'Exported Folder',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: folderItem?.item || [],
    },
    null,
    2
  )

  const dialog =
    await window.apiTester
      ?.showSaveDialog?.({
        filters: [
          {
            name: 'JSON Files',
            extensions: ['json'],
          },
        ],
        defaultPath:
          `${folder.name || 'Folder'}.json`,
      })

  if (
    !dialog ||
    dialog.canceled ||
    !dialog.filePath
  ) {
    return
  }

  await window.apiTester
    ?.writeFile?.(
      dialog.filePath,
      content
    )
}





  /* =======================================================
     RENAME COLLECTION
     ======================================================= */

  function renameCollection(
    collectionId
  ) {
    const collection =
      collections.find(
        (item) =>
          item.id === collectionId
      )

    if (!collection) {
      return
    }

    promptForName(
      'Collection name',
      collection.name,
      (name) => {
        if (
          isDuplicateName(
            collections,
            name,
            collectionId
          )
        ) {
          showValidationError(
            'A collection with that name already exists.'
          )

          return
        }

        setCollections(
          (currentCollections) =>
            currentCollections.map(
              (item) =>
                item.id ===
                collectionId
                  ? {
                      ...item,
                      name,
                    }
                  : item
            )
        )
      }
    )
  }


  /* =======================================================
     DUPLICATE COLLECTION
     ======================================================= */

  function duplicateCollection(
    collectionId
  ) {
    const collection =
      collections.find(
        (item) =>
          item.id === collectionId
      )

    if (!collection) {
      return
    }

    const existingNames =
      collections.map(
        (item) => item.name
      )

    const name =
      generateUniqueName(
        collection.name,
        existingNames
      )

    function cloneTree(node) {
      if (!node) return null

      const cloned = {
        ...node,
        id: createId(),
      }

      if (node.type === 'request') {
        return {
          ...cloned,
          ...duplicateRequestData(
            node,
            node.name
          ),
          id: createId(),
          type: 'request',
        }
      }

      return {
        ...cloned,
        children:
          Array.isArray(
            node.children
          )
            ? node.children.map(
                cloneTree
              )
            : [],
      }
    }

    const duplicate = {
      ...cloneTree(collection),
      id: createId(),
      name,
      type: 'collection',
      expanded: true,
    }

    setCollections(
      (current) => [
        ...current,
        duplicate,
      ]
    )

    const firstRequest =
      findFirstRequest(
        duplicate
      )

    setSelectedRequestId(
      firstRequest?.id ?? null
    )
  }


  /* =======================================================
     DELETE COLLECTION
     ======================================================= */

  function deleteCollection(
    collectionId
  ) {
    const collection =
      collections.find(
        (item) =>
          item.id === collectionId
      )

    if (!collection) {
      return
    }

    if (collections.length <= 1) {
      showValidationError(
        'You cannot delete the last collection.'
      )

      return
    }

    promptForName(
      `Delete collection "${collection.name}" and all of its requests? Type DELETE to confirm.`,
      '',
      (value) => {
        if (
          String(value ?? '')
            .trim()
            .toLowerCase() !==
          'delete'
        ) {
          return
        }

        const remainingCollections =
          collections.filter(
            (item) =>
              item.id !==
              collectionId
          )

        setCollections(
          remainingCollections
        )

        const selectedInsideDeleted =
          findNode(
            collection,
            selectedRequestId
          )

        if (
          selectedInsideDeleted
        ) {
          const firstRequest =
            findFirstRequest(
              remainingCollections[0]
            )

          setSelectedRequestId(
            firstRequest?.id ??
            null
          )
        }
      }
    )
  }


  /* =======================================================
     RENAME REQUEST
     ======================================================= */

  function renameRequest(
    collectionId,
    requestId
  ) {
    const collection =
      collections.find(
        (item) =>
          item.id === collectionId
      )

    const request =
      collection
        ? findNode(
            collection,
            requestId
          )
        : null

    if (
      !collection ||
      !request ||
      request.type !== 'request'
    ) {
      return
    }

    const allRequests =
      getAllRequests(
        collection
      )

    promptForName(
      'Request name',
      request.name,
      (name) => {
        if (
          isDuplicateName(
            allRequests,
            name,
            requestId
          )
        ) {
          showValidationError(
            'A request with that name already exists in this collection.'
          )

          return
        }

        setCollections(
          (currentCollections) =>
            currentCollections.map(
              (item) =>
                item.id ===
                collectionId
                  ? updateTreeNode(
                      item,
                      requestId,
                      {
                        name,
                      }
                    )
                  : item
            )
        )
      }
    )
  }


  /* =======================================================
     DUPLICATE REQUEST
     ======================================================= */

  function duplicateRequestInCollection(
    collectionId,
    requestId
  ) {
    const collection =
      collections.find(
        (item) =>
          item.id === collectionId
      )

    const request =
      collection
        ? findNode(
            collection,
            requestId
          )
        : null

    if (
      !collection ||
      !request ||
      request.type !== 'request'
    ) {
      return
    }

    const existingNames =
      getAllRequests(
        collection
      ).map(
        (item) =>
          item.name
      )

    const name =
      generateUniqueName(
        request.name,
        existingNames
      )

    const duplicate =
      createRequestNode(
        duplicateRequestData(
          request,
          name
        )
      )

    const parent =
      findParent(
        collection,
        requestId
      )

    const parentId =
      parent?.id ??
      collection.id

    setCollections(
      (currentCollections) =>
        currentCollections.map(
          (item) =>
            item.id ===
            collectionId
              ? insertNode(
                  item,
                  parentId,
                  duplicate
                )
              : item
        )
    )

    setSelectedRequestId(
      duplicate.id
    )
  }


  /* =======================================================
     DELETE REQUEST
     ======================================================= */

  function deleteRequest(
    collectionId,
    requestId
  ) {
    const collection =
      collections.find(
        (item) =>
          item.id === collectionId
      )

    const request =
      collection
        ? findNode(
            collection,
            requestId
          )
        : null

    if (
      !collection ||
      !request ||
      request.type !== 'request'
    ) {
      return
    }

    promptForName(
      `Delete request "${request.name}"? Type DELETE to confirm.`,
      '',
      (value) => {
        if (
          String(value ?? '')
            .trim()
            .toLowerCase() !==
          'delete'
        ) {
          return
        }

        setCollections(
          (currentCollections) =>
            currentCollections.map(
              (item) =>
                item.id ===
                collectionId
                  ? deleteNodeFromTree(
                      item,
                      requestId
                    )
                  : item
            )
        )

        if (
          selectedRequestId ===
          requestId
        ) {
          const remainingRequests =
            getAllRequests(
              collection
            ).filter(
              (item) =>
                item.id !==
                requestId
            )

          setSelectedRequestId(
            remainingRequests[0]
              ?.id ?? null
          )
        }
      }
    )
  }


  /* =======================================================
     UPDATE REQUEST
     ======================================================= */

  function updateRequest(
    updatedRequest
  ) {
    if (!updatedRequest?.id) {
      return
    }

    setCollections(
      (currentCollections) =>
        currentCollections.map(
          (collection) =>
            findNode(
              collection,
              updatedRequest.id
            )
              ? updateTreeNode(
                  collection,
                  updatedRequest.id,
                  updatedRequest
                )
              : collection
        )
    )
  }


  /* =======================================================
     RESTORE REQUEST FROM HISTORY
     ======================================================= */

  function restoreRequest(
    template,
    preferredCollectionId = null
  ) {
    const targetCollection =
      preferredCollectionId
        ? collections.find(
            (collection) =>
              collection.id ===
              preferredCollectionId
          )
        : findCollectionContainingRequest(
            collections,
            selectedRequestId
          ) ??
          collections[0]

    if (!targetCollection) {
      return null
    }

    const request =
      createRequestNode(
        buildRequestFromTemplate(
          template,
          `Copy of ${
            template?.name ??
            'Request'
          }`
        )
      )

    setCollections(
      (currentCollections) =>
        currentCollections.map(
          (collection) =>
            collection.id ===
            targetCollection.id
              ? insertNode(
                  collection,
                  collection.id,
                  request
                )
              : collection
        )
    )

    setSelectedRequestId(
      request.id
    )

    return request
  }


  /* =======================================================
     MOVE NODE
     ======================================================= */

  function moveCollectionNode(
    collectionId,
    nodeId,
    destinationId,
    index = null
  ) {
    setCollections(
      (currentCollections) =>
        currentCollections.map(
          (collection) => {
            if (
              collection.id !==
              collectionId
            ) {
              return collection
            }

            return moveNode(
              collection,
              nodeId,
              destinationId,
              index
            )
          }
        )
    )
  }


  /* =======================================================
     CREATE FOLDER
     ======================================================= */

function createFolder(parentId) {
  if (!parentId) {
    return null
  }

  // Find the actual parent node and the collection containing it.
  // parentId can be a collection ID or any folder ID.
  let parentNode = null
  let parentCollection = null

  for (const collection of collections) {
    const found = findNode(collection, parentId)

    if (found) {
      parentNode = found
      parentCollection = collection
      break
    }
  }

  if (!parentNode || !parentCollection) {
    return null
  }

  // Collect all existing folder names from this collection.
  const existingFolderNames = []

  function collectFolderNames(node) {
    if (!node) {
      return
    }

    if (node.type === 'folder') {
      existingFolderNames.push(node.name)
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(collectFolderNames)
    }
  }

  collectFolderNames(parentCollection)

  // Existing naming convention:
  // New Folder
  // New Folder Copy
  // New Folder Copy 1
  // New Folder Copy 2
  const name = generateUniqueName(
    'New Folder',
    existingFolderNames
  )

  const folder = createFolderNode(name)

  setCollections((currentCollections) =>
    currentCollections.map((collection) => {
      if (collection.id !== parentCollection.id) {
        return collection
      }

      return insertNode(
        collection,
        parentId,
        folder
      )
    })
  )

  return folder.id
}

  /* =======================================================
     RETURN API
     ======================================================= */

  return {
  collections,
  selectedRequestId,
  selectedRequest,
  createNewCollection,
  importCollection,
  exportCollection,
  importCollectionIntoCollection,
  createNewRequest,
  selectRequest,
  toggleCollection,
  renameCollection,
  duplicateCollection,
  deleteCollection,
  renameRequest,
  duplicateRequest: duplicateRequestInCollection,
  deleteRequest,
  updateRequest,
  restoreRequest,

  createFolder,
  renameFolder,
  duplicateFolder,
  deleteFolder,
  exportFolder,
  moveCollectionNode,
}
}