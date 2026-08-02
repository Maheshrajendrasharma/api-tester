import { useEffect, useMemo, useState } from 'react'
import { addHistory, clearHistory, deleteHistory, duplicateHistory, filterHistory, getFavorites, loadHistory, renameHistory, searchHistory, toggleFavorite } from '../services/historyService'
import { getActiveEnvironment } from '../services/environmentService'

export function useHistory({ onShowDialog } = {}) {
  const [entries, setEntries] = useState(() => loadHistory())
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    setEntries(loadHistory())
  }, [])

  const activeEnvironment = getActiveEnvironment()

  const displayHistory = useMemo(() => {
    const filteredByMethod = filterHistory(entries, filter)
    return searchHistory(searchQuery, filteredByMethod)
  }, [entries, filter, searchQuery])

  const favorites = useMemo(() => getFavorites(entries), [entries])

  function addEntry(entry) {
    const nextEntries = addHistory({ ...entry, environment: entry.environment ?? activeEnvironment })
    setEntries(nextEntries)
    return nextEntries
  }

  function deleteEntry(id) {
    const nextEntries = deleteHistory(id, entries)
    setEntries(nextEntries)
    return nextEntries
  }

  function clearEntries() {
    const nextEntries = clearHistory()
    setEntries(nextEntries)
    return nextEntries
  }

  function promptForName(message, initialName, onComplete) {
    onShowDialog?.({ open: true, type: 'input', title: message, message: '', initialValue: initialName, options: [], confirmLabel: 'Save', cancelLabel: 'Cancel', onConfirm: (value) => { onShowDialog?.({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], confirmLabel: 'Save', cancelLabel: 'Cancel', onConfirm: null, onCancel: null }); const trimmed = String(value ?? '').trim(); if (trimmed) onComplete(trimmed) }, onCancel: () => onShowDialog?.({ open: false, type: 'input', title: '', message: '', initialValue: '', options: [], confirmLabel: 'Save', cancelLabel: 'Cancel', onConfirm: null, onCancel: null }) })
  }

  function renameEntry(id) {
    promptForName('Rename history entry', entries.find((entry) => entry.id === id)?.name ?? '', (name) => {
      const nextEntries = renameHistory(id, name, entries)
      setEntries(nextEntries)
    })
    return null
  }

  function duplicateEntry(id) {
    const nextEntries = duplicateHistory(id, entries)
    setEntries(nextEntries)
    return nextEntries
  }

  function toggleFavoriteEntry(id) {
    const nextEntries = toggleFavorite(id, entries)
    setEntries(nextEntries)
    return nextEntries
  }

  return {
    entries,
    displayHistory,
    favorites,
    searchQuery,
    filter,
    activeEnvironment,
    setSearchQuery,
    setFilter,
    addEntry,
    deleteEntry,
    clearEntries,
    renameEntry,
    duplicateEntry,
    toggleFavorite: toggleFavoriteEntry,
  }
}
