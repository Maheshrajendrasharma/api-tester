import { useEffect, useMemo, useState } from 'react'
import { loadCollections, saveCollections } from '../services/storageService'
import { buildRequestFromTemplate, duplicateCollectionData, duplicateRequestData } from '../services/collectionService'
import { exportCollection as exportCollectionData, importCollectionFromFile } from '../services/importExportService'
import { isDuplicateName } from '../utils/validators'
import { createCollection, createId, createRequest } from '../utils/requestModel'

function duplicateRequest(request, name) {
  return duplicateRequestData(request, name)
}

function generateUniqueName(baseName, existingNames) {

  // Remove any previous Copy suffix
  const cleanBase = baseName.replace(/\sCopy(?:\s\d+)?$/, '')

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
    counter++
  }

  return `${cleanBase} Copy ${counter}`
}

export function useCollections({ onShowDialog } = {}) {
  const [collections, setCollections] = useState([])
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [collectionsReady, setCollectionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function restoreCollections() {
      try {
        const savedCollections = await loadCollections()
        const initialCollections = savedCollections.length ? savedCollections : [createCollection()]
        if (isMounted) {
          setCollections(initialCollections)
          setSelectedRequestId(initialCollections[0]?.requests[0]?.id ?? null)
        }
      } catch {
        if (isMounted) {
          const initialCollection = createCollection()
          setCollections([initialCollection])
          setSelectedRequestId(initialCollection.requests[0].id)
        }
      } finally {
        if (isMounted) setCollectionsReady(true)
      }
    }

    restoreCollections()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (collectionsReady) saveCollections(collections).catch(() => {})
  }, [collections, collectionsReady])

  const selectedRequest = useMemo(() => (
    collections.flatMap((collection) => collection.requests).find((request) => request.id === selectedRequestId) ?? null
  ), [collections, selectedRequestId])

  function showValidationError(message) {
    onShowDialog?.({ open: true, type: 'confirm', title: 'Notice', message, initialValue: '', options: [], confirmLabel: 'OK', cancelLabel: '', onConfirm: () => onShowDialog?.({ open: false, type: 'confirm', title: '', message: '', initialValue: '', options: [], confirmLabel: 'OK', cancelLabel: '', onConfirm: null, onCancel: null }), onCancel: () => onShowDialog?.({ open: false, type: 'confirm', title: '', message: '', initialValue: '', options: [], confirmLabel: 'OK', cancelLabel: '', onConfirm: null, onCancel: null }) })
  }

  function promptForName(message, initialName, onComplete) {
    onShowDialog?.({ open: true, type: 'input', title: message, message: '', initialValue: initialName, options: [], confirmLabel: 'Save', cancelLabel: 'Cancel', onConfirm: (value) => { onShowDialog?.({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], confirmLabel: 'Save', cancelLabel: 'Cancel', onConfirm: null, onCancel: null }); const trimmed = String(value ?? '').trim(); if (trimmed) onComplete(trimmed) }, onCancel: () => onShowDialog?.({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], confirmLabel: 'Save', cancelLabel: 'Cancel', onConfirm: null, onCancel: null }) })
  }

  function createNewCollection() {
  const existingNames = collections.map(c => c.name)

  const name = generateUniqueName(
    'New Collection',
    existingNames
  )

  const collection = createCollection(name)

  setCollections(current => [...current, collection])

  setSelectedRequestId(collection.requests[0].id)
}

  async function importCollection() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const importedCollection = await importCollectionFromFile(file)
        const defaultName = importedCollection.name || file.name.replace(/\.json$/i, '')
        promptForName('Import collection as', defaultName, (name) => {
          if (isDuplicateName(collections, name)) return showValidationError('A collection with that name already exists.')
          const collection = { ...importedCollection, id: createId(), name, expanded: true, requests: importedCollection.requests.map((request) => duplicateRequestData(request, request.name)) }
          setCollections((currentCollections) => [...currentCollections, collection])
          setSelectedRequestId(collection.requests[0]?.id ?? null)
        })
      } catch (error) {
        showValidationError(error?.message || 'Import failed.')
      }
    }
    input.click()
  }

  async function exportCollection(collectionId = null) {
    const collection = collections.find((item) => item.id === collectionId) ?? collections.find((item) => item.requests.some((request) => request.id === selectedRequestId)) ?? collections[0]
    if (!collection) return

    try {
      const content = await exportCollectionData(collection)
      const dialog = await window.apiTester?.showSaveDialog?.({
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        defaultPath: `${collection.name}.json`,
      })

      if (!dialog || dialog.canceled || !dialog.filePath) return
      await window.apiTester?.writeFile?.(dialog.filePath, content)
    } catch (error) {
      showValidationError(error?.message || 'Export failed.')
    }
  }

  async function importCollectionIntoCollection(collectionId) {
    const targetCollection = collections.find((item) => item.id === collectionId)
    if (!targetCollection) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const importedCollection = await importCollectionFromFile(file)
        const importedRequests = importedCollection.requests.map((request) => {
          const baseName = request.name || 'New Request'
          const existingNames = targetCollection.requests.map((existingRequest) => existingRequest.name)
          let uniqueName = baseName
          let counter = 2
          while (existingNames.includes(uniqueName)) {
            uniqueName = `${baseName} ${counter}`
            counter += 1
          }
          return duplicateRequestData(request, uniqueName)
        })

        setCollections((currentCollections) => currentCollections.map((collection) => (
          collection.id === collectionId
            ? {
                ...collection,
                expanded: true,
                requests: [...collection.requests, ...importedRequests],
              }
            : collection
        )))
        setSelectedRequestId(importedRequests[0]?.id ?? null)
      } catch (error) {
        showValidationError(error?.message || 'Import failed.')
      }
    }
    input.click()
  }

  function createNewRequest(collectionId) {

  const collection = collections.find(
    item => item.id === collectionId
  )

  if (!collection) return

  const existingNames =
    collection.requests.map(r => r.name)

  const name =
    generateUniqueName(
      'New Request',
      existingNames
    )

  const request = createRequest(name)

  setCollections(current =>
    current.map(item =>
      item.id === collectionId
        ? {
            ...item,
            expanded: true,
            requests: [...item.requests, request]
          }
        : item
    )
  )

  setSelectedRequestId(request.id)
}

  function toggleCollection(collectionId) {
    setCollections((currentCollections) => currentCollections.map((collection) => (
      collection.id === collectionId ? { ...collection, expanded: !collection.expanded } : collection
    )))
  }

  function renameCollection(collectionId) {
    const collection = collections.find((item) => item.id === collectionId)
    if (!collection) return
    promptForName('Collection name', collection.name, (name) => {
      if (isDuplicateName(collections, name, collectionId)) return showValidationError('A collection with that name already exists.')
      setCollections((currentCollections) => currentCollections.map((item) => (item.id === collectionId ? { ...item, name } : item)))
    })
  }

  function duplicateCollection(collectionId) {

  const collection = collections.find(
    item => item.id === collectionId
  )

  if (!collection) return

  const existingNames =
    collections.map(c => c.name)

  const name =
    generateUniqueName(
      collection.name,
      existingNames
    )

  const duplicate =
    duplicateCollectionData(collection, name)

  setCollections(current => [
    ...current,
    duplicate
  ])

  setSelectedRequestId(
    duplicate.requests[0]?.id ?? null
  )
}

  function deleteCollection(collectionId) {
    const collection = collections.find((item) => item.id === collectionId)
    if (!collection) return
    if (collections.length <= 1) {
      showValidationError('You cannot delete the last collection.')
      return
    }
    promptForName(`Delete collection "${collection.name}" and all of its requests? Type DELETE to confirm.`, '', (value) => {
      if (String(value ?? '').trim().toLowerCase() !== 'delete') return
      const remainingCollections = collections.filter((item) => item.id !== collectionId)
      setCollections(remainingCollections)
      if (collection.requests.some((request) => request.id === selectedRequestId)) setSelectedRequestId(remainingCollections[0]?.requests[0]?.id ?? null)
    })
  }

  function renameRequest(collectionId, requestId) {
    const collection = collections.find((item) => item.id === collectionId)
    const request = collection?.requests.find((item) => item.id === requestId)
    if (!collection || !request) return
    promptForName('Request name', request.name, (name) => {
      if (isDuplicateName(collection.requests, name, requestId)) return showValidationError('A request with that name already exists in this collection.')
      setCollections((currentCollections) => currentCollections.map((item) => (
        item.id === collectionId ? { ...item, requests: item.requests.map((savedRequest) => (savedRequest.id === requestId ? { ...savedRequest, name } : savedRequest)) } : item
      )))
    })
  }

  function duplicateRequestInCollection(collectionId, requestId) {

  const collection = collections.find(
    item => item.id === collectionId
  )

  const request = collection?.requests.find(
    item => item.id === requestId
  )

  if (!collection || !request) return

  const existingNames =
    collection.requests.map(r => r.name)

  const name =
    generateUniqueName(
      request.name,
      existingNames
    )

  const duplicate =
    duplicateRequest(request, name)

  setCollections(current =>
    current.map(item =>
      item.id === collectionId
        ? {
            ...item,
            requests: [
              ...item.requests,
              duplicate
            ]
          }
        : item
    )
  )

  setSelectedRequestId(duplicate.id)
}

  function deleteRequest(collectionId, requestId) {
    const collection = collections.find((item) => item.id === collectionId)
    const request = collection?.requests.find((item) => item.id === requestId)
    if (!collection || !request) return
    promptForName(`Delete request "${request.name}"? Type DELETE to confirm.`, '', (value) => {
      if (String(value ?? '').trim().toLowerCase() !== 'delete') return
      const remainingRequests = collection.requests.filter((item) => item.id !== requestId)
      setCollections((currentCollections) => currentCollections.map((item) => (
        item.id === collectionId ? { ...item, requests: remainingRequests } : item
      )))
      if (selectedRequestId === requestId) setSelectedRequestId(remainingRequests[0]?.id ?? null)
    })
  }

  function updateRequest(updatedRequest) {
    setCollections((currentCollections) => currentCollections.map((collection) => ({
      ...collection,
      requests: collection.requests.map((request) => (request.id === updatedRequest.id ? updatedRequest : request)),
    })))
  }

  function restoreRequest(template, preferredCollectionId = null) {
    const targetCollectionId = preferredCollectionId ?? collections.find((collection) => collection.requests.some((request) => request.id === selectedRequestId))?.id ?? collections[0]?.id
    const collection = collections.find((item) => item.id === targetCollectionId)
    if (!collection) return null

    const request = buildRequestFromTemplate(template, `Copy of ${template?.name ?? 'Request'}`)

    setCollections((currentCollections) => currentCollections.map((item) => (
      item.id === targetCollectionId ? { ...item, expanded: true, requests: [...item.requests, request] } : item
    )))
    setSelectedRequestId(request.id)
    return request
  }

  return { collections, selectedRequestId, selectedRequest, createNewCollection, importCollection, exportCollection, importCollectionIntoCollection, createNewRequest, selectRequest: (_collectionId, requestId) => setSelectedRequestId(requestId), toggleCollection, renameCollection, duplicateCollection, deleteCollection, renameRequest, duplicateRequest: duplicateRequestInCollection, deleteRequest, updateRequest, restoreRequest }
}
