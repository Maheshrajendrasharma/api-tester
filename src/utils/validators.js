export function isDuplicateName(items, name, ignoredId) {
  return items.some((item) => item.id !== ignoredId && item.name.toLowerCase() === name.toLowerCase())
}

export function isValidUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function hasHeaderKey(header) {
  return Boolean(header.enabled && header.key.trim())
}
