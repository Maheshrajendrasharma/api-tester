import { createId } from '../utils/requestModel'

const STORAGE_KEY = 'api-tester.history'
const MAX_HISTORY_ITEMS = 1000

function normalizeEntry(entry) {
  return {
    id: entry?.id ?? createId(),
    name: entry?.name ?? 'Untitled Request',
    timestamp: Number.isFinite(entry?.timestamp) ? entry.timestamp : Date.now(),
    method: entry?.method ?? 'GET',
    url: entry?.url ?? '',
    resolvedUrl: entry?.resolvedUrl ?? entry?.url ?? '',
    statusCode: entry?.statusCode ?? null,
    statusText: entry?.statusText ?? '',
    responseTime: entry?.responseTime ?? 0,
    responseSize: entry?.responseSize ?? 0,
    environment: entry?.environment ?? null,
    headers: Array.isArray(entry?.headers) ? entry.headers : [],
    params: Array.isArray(entry?.params) ? entry.params : [],
    authorization: entry?.authorization ?? null,
    requestBody: entry?.requestBody ?? '',
    responseBody: entry?.responseBody ?? '',
    favorite: Boolean(entry?.favorite),
  }
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => right.timestamp - left.timestamp)
}

function normalizeEntries(entries) {
  return sortEntries((Array.isArray(entries) ? entries : []).map((entry) => normalizeEntry(entry))).slice(0, MAX_HISTORY_ITEMS)
}

export function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return normalizeEntries(parsed)
    }

    if (parsed && Array.isArray(parsed.history)) {
      return normalizeEntries(parsed.history)
    }

    return []
  } catch {
    return []
  }
}

export function saveHistory(entries) {
  const nextEntries = normalizeEntries(entries)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries))
  return nextEntries
}

export function addHistory(entry, existingEntries = loadHistory()) {
  const nextEntries = [normalizeEntry(entry), ...existingEntries.filter((historyEntry) => historyEntry.id !== entry?.id)].slice(0, MAX_HISTORY_ITEMS)
  return saveHistory(nextEntries)
}

export function deleteHistory(id, existingEntries = loadHistory()) {
  const nextEntries = existingEntries.filter((historyEntry) => historyEntry.id !== id)
  return saveHistory(nextEntries)
}

export function clearHistory() {
  return saveHistory([])
}

export function searchHistory(query, existingEntries = loadHistory()) {
  const normalizedQuery = query?.trim().toLowerCase() ?? ''

  if (!normalizedQuery) {
    return existingEntries
  }

  return existingEntries.filter((historyEntry) => {
    const haystack = [
      historyEntry.method,
      historyEntry.url,
      historyEntry.resolvedUrl,
      historyEntry.environment?.name ?? '',
      historyEntry.statusCode ?? '',
      historyEntry.statusText,
    ].join(' ').toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

export function filterHistory(existingEntries = loadHistory(), method = 'All') {
  if (!method || method === 'All') {
    return existingEntries
  }

  return existingEntries.filter((historyEntry) => historyEntry.method === method)
}

export function getHistory() {
  return loadHistory()
}

export function toggleFavorite(id, existingEntries = loadHistory()) {
  return saveHistory(existingEntries.map((historyEntry) => (
    historyEntry.id === id ? { ...historyEntry, favorite: !historyEntry.favorite } : historyEntry
  )))
}

export function renameHistory(id, name, existingEntries = loadHistory()) {
  return saveHistory(existingEntries.map((historyEntry) => (
    historyEntry.id === id ? { ...historyEntry, name } : historyEntry
  )))
}

export function duplicateHistory(id, existingEntries = loadHistory()) {
  const sourceEntry = existingEntries.find((historyEntry) => historyEntry.id === id)

  if (!sourceEntry) {
    return existingEntries
  }

  const duplicatedEntry = {
    ...sourceEntry,
    id: createId(),
    timestamp: Date.now(),
    favorite: false,
    name: `${sourceEntry.name} Copy`,
  }

  return saveHistory([duplicatedEntry, ...existingEntries.filter((historyEntry) => historyEntry.id !== id)])
}

export function getFavorites(existingEntries = loadHistory()) {
  return existingEntries.filter((historyEntry) => historyEntry.favorite)
}
