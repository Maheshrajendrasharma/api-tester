const VARIABLE_PATTERN = /(?<!\\)\{\{\s*([^{}]+?)\s*\}\}/g

export function getVariableReferences(text, environment) {
  if (typeof text !== 'string') return []

  const variables = Array.isArray(environment?.variables) ? environment.variables : []
  return [...text.matchAll(VARIABLE_PATTERN)].map((match) => {
    const key = match[1].trim()
    const variable = variables.find((item) => String(item?.key ?? '').trim() === key)
    const status = !variable ? 'undefined' : variable.enabled === false ? 'disabled' : 'enabled'
    return { key, start: match.index, end: match.index + match[0].length, status, value: variable?.value }
  })
}

export function getAutocompleteQuery(text, cursorPosition) {
  if (typeof text !== 'string') return null

  const beforeCursor = text.slice(0, cursorPosition)
  const openingIndex = beforeCursor.lastIndexOf('{{')
  if (openingIndex === -1 || beforeCursor.slice(openingIndex).includes('}}')) return null
  return { start: openingIndex, end: cursorPosition, query: beforeCursor.slice(openingIndex + 2).trim() }
}
