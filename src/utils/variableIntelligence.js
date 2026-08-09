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
  if (typeof text !== 'string') return null;
  // Ensure cursor is within bounds
  const cursor = Math.max(0, Math.min(cursorPosition ?? text.length, text.length));
  // Find the last "{{" before cursor
  const openingIndex = text.lastIndexOf('{{', cursor);
  if (openingIndex === -1) return null;
  // Find the next closing "}}" after opening
  const closingIndex = text.indexOf('}}', openingIndex + 2);
  // If a "}}" exists before the cursor, we're not in a variable
  if (closingIndex !== -1 && closingIndex < cursor) return null;
  const queryEnd = (closingIndex !== -1 ? closingIndex : cursor);
  const query = text.slice(openingIndex + 2, queryEnd).trim();
  return {
    start: openingIndex,
    end: closingIndex !== -1 ? closingIndex + 2 : cursor,
    query,
  };
}
