import { createCollection, createId, createRequest } from '../utils/requestModel'
import { normalizeAuthorization } from "./importers/postmanAuth";
import { normalizeScripts } from "./importers/postmanScripts";
import { normalizeBody } from "./importers/postmanBody";
  import { importPostmanRequest } from "./postmanRequestImporter";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function sanitizeName(value, fallback) {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}




function normalizeRequestData(value, fallbackName = 'New Request') {
  const baseRequest = createRequest(fallbackName)
  const source = value && typeof value === 'object' ? value : {}

  const params = Array.isArray(source.params)
    ? source.params.map((parameter) => ({
        ...parameter,
        id: createId(),
        enabled: parameter.enabled ?? true,
        key: parameter.key ?? '',
        value: parameter.value ?? '',
      }))
    : baseRequest.params.map((parameter) => ({ ...parameter, id: createId() }))

  const headers = Array.isArray(source.headers)
    ? source.headers.map((header) => ({
        ...header,
        id: createId(),
        enabled: header.enabled ?? true,
        key: header.key ?? '',
        value: header.value ?? '',
      }))
    : baseRequest.headers.map((header) => ({ ...header, id: createId() }))

    return {
      ...baseRequest,
      ...source,
      id: createId(),
      name: sanitizeName(source.name || fallbackName, fallbackName),
      method: source.method || baseRequest.method,
      url: source.url || baseRequest.url,
      params,
      headers,
      authorization: source.authorization ? { ...baseRequest.authorization, ...source.authorization } : { ...baseRequest.authorization },
  body:
    typeof source.body === "string"
      ? source.body
      : normalizeBody(source.body) || baseRequest.body,
  }
}
function normalizePostmanRequest(item, fallbackName = "New Request") {

    return normalizeRequestData(
        importPostmanRequest(item),
        fallbackName
    );

}

function normalizePostmanCollection(raw, fallbackName = 'Imported Collection') {
  const items = Array.isArray(raw?.item) ? raw.item : []
  const collectionBase = createCollection(sanitizeName(raw?.info?.name || fallbackName, fallbackName))
  const folders = []
  const requests = []

  function visit(itemsList, parentFolder = null) {
    itemsList.forEach((item) => {
      if (!item || typeof item !== 'object') return
      if (Array.isArray(item.item)) {
        const folder = {
          id: createId(),
          name: sanitizeName(item.name || 'Folder', 'Folder'),
          requests: [],
          folders: [],
        }
        if (parentFolder) {
          parentFolder.folders.push(folder)
        } else {
          folders.push(folder)
        }
        visit(item.item, folder)
        return
      }

      if (item.request || item.name) {
        const request = normalizePostmanRequest(item, item.name || 'New Request')
        requests.push(request)
        if (parentFolder) {
          parentFolder.requests.push(request)
        }
      }
    })
  }

  visit(items)

  return {
    ...collectionBase,
    id: createId(),
    name: sanitizeName(raw?.info?.name || fallbackName, fallbackName),
    expanded: true,
    folders,
    requests,
  }
}

export function normalizeCollectionData(raw, fallbackName = 'Imported Collection') {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Unsupported collection format.')
  }

  if (Array.isArray(raw.collections) && raw.collections.length) {
    return normalizeCollectionData(raw.collections[0], fallbackName)
  }

  if (Array.isArray(raw.item) || Array.isArray(raw.items)) {
    return normalizePostmanCollection(raw, fallbackName)
  }

  if (raw.requests || raw.name || raw.folders || raw.id || raw.expanded) {
    const baseCollection = createCollection(sanitizeName(raw.name || fallbackName, fallbackName))
    const collectionRequests = Array.isArray(raw.requests)
      ? raw.requests.map((request) => normalizeRequestData(request, request?.name || 'New Request'))
      : [normalizeRequestData({}, 'New Request')]
    const folders = Array.isArray(raw.folders)
      ? raw.folders.map((folder) => ({
          ...folder,
          id: createId(),
          name: sanitizeName(folder.name || 'Folder', 'Folder'),
          requests: Array.isArray(folder.requests) ? folder.requests.map((request) => normalizeRequestData(request, request?.name || 'New Request')) : [],
          folders: Array.isArray(folder.folders) ? folder.folders.map((nestedFolder) => ({
            ...nestedFolder,
            id: createId(),
            name: sanitizeName(nestedFolder.name || 'Folder', 'Folder'),
            requests: Array.isArray(nestedFolder.requests) ? nestedFolder.requests.map((request) => normalizeRequestData(request, request?.name || 'New Request')) : [],
            folders: [],
          })) : [],
        }))
      : []

    return {
      ...baseCollection,
      ...raw,
      id: createId(),
      name: sanitizeName(raw.name || fallbackName, fallbackName),
      expanded: true,
      folders,
      requests: collectionRequests,
    }
  }

  throw new Error('Unsupported collection format.')
}

export function duplicateCollectionData(collection, name) {
  return {
    ...cloneValue(collection),
    id: createId(),
    name,
    expanded: true,
    folders: cloneValue(collection.folders ?? []),
    requests: collection.requests.map((request) => duplicateRequestData(request, request.name)),
  }
}

export function duplicateRequestData(request, name) {
  return {
    ...cloneValue(request),
    id: createId(),
    name,
    params: request.params.map((parameter) => ({ ...parameter, id: createId() })),
    headers: request.headers.map((header) => ({ ...header, id: createId() })),
    authorization: { ...request.authorization },
  }
}

export function buildRequestFromTemplate(template, fallbackName) {
  const baseRequest = createRequest(fallbackName)

  const params = Array.isArray(template?.params)
    ? template.params.map((parameter) => ({ ...parameter, id: createId(), enabled: parameter.enabled ?? true, key: parameter.key ?? '', value: parameter.value ?? '' }))
    : baseRequest.params.map((parameter) => ({ ...parameter, id: createId() }))

  const headers = Array.isArray(template?.headers)
    ? template.headers.map((header) => ({ ...header, id: createId(), enabled: header.enabled ?? true, key: header.key ?? '', value: header.value ?? '' }))
    : baseRequest.headers.map((header) => ({ ...header, id: createId() }))

  return {
    ...baseRequest,
    ...template,
    id: createId(),
    name: template?.name ?? fallbackName,
    method: template?.method ?? baseRequest.method,
    url: template?.url ?? baseRequest.url,
    params,
    headers,
    authorization: template?.authorization ? { ...baseRequest.authorization, ...template.authorization } : { ...baseRequest.authorization },
    body: template?.body ?? baseRequest.body,
  }
}

export function serializeCollectionForExport(collection) {
  return JSON.stringify({
    version: 'api-tester-collection',
    collection: {
      ...collection,
      requests: collection.requests.map((request) => ({ ...request, params: request.params ?? [], headers: request.headers ?? [] })),
      folders: collection.folders ?? [],
    },
  }, null, 2)
}
export function normalizeEnvironmentData(raw, fallbackName = 'Imported Environment') {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Unsupported environment format.')
  }

  const name = sanitizeName(raw.name || fallbackName, fallbackName)

  // Supports both our own exported format and Postman format
  const source =
    Array.isArray(raw.variables)
      ? raw.variables
      : Array.isArray(raw.values)
      ? raw.values
      : []

  let variables = source.map(variable => ({
    id: createId(),
    key: String(variable.key ?? ''),
    value: String(variable.value ?? ''),
    enabled: variable.enabled !== false,
  }))

  // Always keep one blank row
  variables.push({
    id: createId(),
    key: '',
    value: '',
    enabled: true,
  })

  return {
    id: createId(),
    name,
    active: false,
    variables,
  }
}

export function serializeEnvironmentForExport(environment) {
  return JSON.stringify({
    name: environment.name,
    variables: (environment.variables ?? []).map((variable) => ({
      key: variable.key,
      value: variable.value,
      enabled: variable.enabled !== false,
    })),
  }, null, 2)
}
