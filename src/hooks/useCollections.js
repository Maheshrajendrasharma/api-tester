import { useEffect, useMemo, useState } from 'react'
import { loadCollections, saveCollections } from '../services/storageService'
import { isDuplicateName } from '../utils/validators'
import { createCollection, createId, createRequest } from '../utils/requestModel'

function askForName(message, initialName) {
  const value = window.prompt(message, initialName)
  return value?.trim() || null
}

function duplicateRequest(request, name) {
  return {
    ...request,
    id: createId(),
    name,
    params: request.params.map((parameter) => ({ ...parameter, id: createId() })),
    headers: request.headers.map((header) => ({ ...header, id: createId() })),
    authorization: { ...request.authorization },
  }
}

export function useCollections() {
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
    window.alert(message)
  }

  function createNewCollection() {
    const name = askForName('Collection name', 'New Collection')
    if (!name) return
    if (isDuplicateName(collections, name)) return showValidationError('A collection with that name already exists.')
    const collection = createCollection(name)
    setCollections((currentCollections) => [...currentCollections, collection])
    setSelectedRequestId(collection.requests[0].id)
  }

  function createNewRequest(collectionId) {
    const collection = collections.find((item) => item.id === collectionId)
    if (!collection) return
    const name = askForName('Request name', 'New Request')
    if (!name) return
    if (isDuplicateName(collection.requests, name)) return showValidationError('A request with that name already exists in this collection.')
    const request = createRequest(name)
    setCollections((currentCollections) => currentCollections.map((item) => (
      item.id === collectionId ? { ...item, expanded: true, requests: [...item.requests, request] } : item
    )))
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
    const name = askForName('Collection name', collection.name)
    if (!name) return
    if (isDuplicateName(collections, name, collectionId)) return showValidationError('A collection with that name already exists.')
    setCollections((currentCollections) => currentCollections.map((item) => (item.id === collectionId ? { ...item, name } : item)))
  }

  function duplicateCollection(collectionId) {
    const collection = collections.find((item) => item.id === collectionId)
    if (!collection) return
    const name = askForName('Duplicate collection name', `${collection.name} Copy`)
    if (!name) return
    if (isDuplicateName(collections, name)) return showValidationError('A collection with that name already exists.')
    const duplicate = { ...collection, id: createId(), name, expanded: true, requests: collection.requests.map((request) => duplicateRequest(request, request.name)) }
    setCollections((currentCollections) => [...currentCollections, duplicate])
    setSelectedRequestId(duplicate.requests[0]?.id ?? null)
  }

  function deleteCollection(collectionId) {
    const collection = collections.find((item) => item.id === collectionId)
    if (!collection || !window.confirm(`Delete collection "${collection.name}" and all of its requests?`)) return
    const remainingCollections = collections.filter((item) => item.id !== collectionId)
    setCollections(remainingCollections)
    if (collection.requests.some((request) => request.id === selectedRequestId)) setSelectedRequestId(remainingCollections[0]?.requests[0]?.id ?? null)
  }

  function renameRequest(collectionId, requestId) {
    const collection = collections.find((item) => item.id === collectionId)
    const request = collection?.requests.find((item) => item.id === requestId)
    if (!collection || !request) return
    const name = askForName('Request name', request.name)
    if (!name) return
    if (isDuplicateName(collection.requests, name, requestId)) return showValidationError('A request with that name already exists in this collection.')
    setCollections((currentCollections) => currentCollections.map((item) => (
      item.id === collectionId ? { ...item, requests: item.requests.map((savedRequest) => (savedRequest.id === requestId ? { ...savedRequest, name } : savedRequest)) } : item
    )))
  }

  function duplicateRequestInCollection(collectionId, requestId) {
    const collection = collections.find((item) => item.id === collectionId)
    const request = collection?.requests.find((item) => item.id === requestId)
    if (!collection || !request) return
    const name = askForName('Duplicate request name', `${request.name} Copy`)
    if (!name) return
    if (isDuplicateName(collection.requests, name)) return showValidationError('A request with that name already exists in this collection.')
    const duplicate = duplicateRequest(request, name)
    setCollections((currentCollections) => currentCollections.map((item) => (
      item.id === collectionId ? { ...item, requests: [...item.requests, duplicate] } : item
    )))
    setSelectedRequestId(duplicate.id)
  }

  function deleteRequest(collectionId, requestId) {
    const collection = collections.find((item) => item.id === collectionId)
    const request = collection?.requests.find((item) => item.id === requestId)
    if (!collection || !request || !window.confirm(`Delete request "${request.name}"?`)) return
    const remainingRequests = collection.requests.filter((item) => item.id !== requestId)
    setCollections((currentCollections) => currentCollections.map((item) => (
      item.id === collectionId ? { ...item, requests: remainingRequests } : item
    )))
    if (selectedRequestId === requestId) setSelectedRequestId(remainingRequests[0]?.id ?? null)
  }

  function updateRequest(updatedRequest) {
    setCollections((currentCollections) => currentCollections.map((collection) => ({
      ...collection,
      requests: collection.requests.map((request) => (request.id === updatedRequest.id ? updatedRequest : request)),
    })))
  }

  return { collections, selectedRequestId, selectedRequest, createNewCollection, createNewRequest, selectRequest: (_collectionId, requestId) => setSelectedRequestId(requestId), toggleCollection, renameCollection, duplicateCollection, deleteCollection, renameRequest, duplicateRequest: duplicateRequestInCollection, deleteRequest, updateRequest }
}
