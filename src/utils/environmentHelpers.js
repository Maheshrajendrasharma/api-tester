export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function clone(data) {
  return JSON.parse(JSON.stringify(data))
}