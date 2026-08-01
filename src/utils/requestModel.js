import { DEFAULT_AUTHORIZATION, DEFAULT_HEADERS, DEFAULT_REQUEST_BODY, DEFAULT_REQUEST_URL } from './constants'

export function createId() {
  return crypto.randomUUID()
}

export function createRequest(name = 'New Request') {
  return {
    id: createId(),
    name,
    method: 'GET',
    url: DEFAULT_REQUEST_URL,
    params: [{ id: createId(), enabled: true, key: '', value: '' }],
    headers: DEFAULT_HEADERS.map((header) => ({ ...header, id: createId() })),
    authorization: { ...DEFAULT_AUTHORIZATION },
    body: DEFAULT_REQUEST_BODY,
  }
}

export function createCollection(name = 'My Collection') {
  return { id: createId(), name, expanded: true, requests: [createRequest()] }
}
