const browserRequestControllers = new Map()

export function isElectronRuntime() {
  return Boolean(window.apiTester?.sendRequest)
}

function buildHeaders(headers) {
  if (Array.isArray(headers)) {
    return headers.reduce((result, header) => {
      if (header?.enabled === false) return result
      const key = String(header?.key ?? '').trim()
      if (key) result[key] = String(header?.value ?? '')
      return result
    }, {})
  }

  return headers && typeof headers === 'object' ? { ...headers } : {}
}

function applyAuthorization(headers, parsedUrl, authorization) {
  if (!authorization || authorization.type === 'None') return

  if (authorization.type === 'Bearer Token' && authorization.bearerToken) {
    headers.Authorization = `Bearer ${String(authorization.bearerToken).trim()}`
  }

  if (authorization.type === 'Basic Auth' && (authorization.username || authorization.password)) {
    headers.Authorization = `Basic ${btoa(`${String(authorization.username ?? '')}:${String(authorization.password ?? '')}`)}`
  }

  if (authorization.type === 'API Key') {
    const key = String(authorization.apiKey ?? '').trim()
    if (!key) return
    const value = String(authorization.apiValue ?? '')
    if (authorization.apiKeyLocation === 'Query Parameter') {
      parsedUrl.searchParams.set(key, value)
    } else {
      headers[key] = value
    }
  }
}

async function executeBrowserRequest(request = {}) {
  const method = String(request.method ?? 'GET').toUpperCase()
  let parsedUrl

  try {
    parsedUrl = new URL(request.url)
  } catch {
    throw new Error(`Please enter a valid request URL: ${request.url ?? ''}`)
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported.')
  }

  const headers = buildHeaders(request.headers)
  applyAuthorization(headers, parsedUrl, request.authorization)
  const controller = new AbortController()
  const requestId = request.__requestId
  if (requestId) browserRequestControllers.set(requestId, controller)

  const startedAt = performance.now()
  try {
    const response = await fetch(parsedUrl, {
      method,
      headers,
      body: request.body && method !== 'GET' && method !== 'HEAD' ? request.body : undefined,
      signal: controller.signal,
    })
    const responseBody = await response.text()

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseBody,
      responseTime: Math.round(performance.now() - startedAt),
      responseSize: new TextEncoder().encode(responseBody).byteLength,
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new Error(
      `Request failed in browser mode: ${error?.message || 'Network error'}. ` +
      'The target API may block this request because of browser CORS policy.'
    )
  } finally {
    if (requestId) browserRequestControllers.delete(requestId)
  }
}

export async function executeRuntimeRequest(request) {
  if (isElectronRuntime()) return window.apiTester.sendRequest(request)
  return executeBrowserRequest(request)
}

export async function cancelRuntimeRequest(requestId) {
  if (!requestId) return false
  if (isElectronRuntime()) return window.apiTester.cancelRequest(requestId)
  const controller = browserRequestControllers.get(requestId)
  if (!controller) return false
  controller.abort()
  browserRequestControllers.delete(requestId)
  return true
}

export function onRuntimeRequestClose(callback) {
  if (!isElectronRuntime() || typeof window.apiTester.onRequestClose !== 'function') {
    return () => {}
  }
  return window.apiTester.onRequestClose(callback)
}

export function forceCloseRuntimeWindow() {
  if (isElectronRuntime() && typeof window.apiTester.forceCloseWindow === 'function') {
    return window.apiTester.forceCloseWindow()
  }
  return false
}

export function onRuntimeMenuAction(callback) {
  if (!isElectronRuntime() || typeof window.apiTester.onMenuAction !== 'function') {
    return () => {}
  }
  return window.apiTester.onMenuAction(callback)
}

export async function saveTextFile({ content, filename, filters = [] }) {
  if (isElectronRuntime()) {
    const dialog = await window.apiTester.showSaveDialog({ filters, defaultPath: filename })
    if (!dialog || dialog.canceled || !dialog.filePath) return false
    await window.apiTester.writeFile(dialog.filePath, content)
    return true
  }

  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  return true
}

export async function pickTextFile({ accept = '.json,application/json' } = {}) {
  if (isElectronRuntime()) {
    const dialog = await window.apiTester.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    })
    if (!dialog || dialog.canceled || !dialog.filePaths?.[0]) return null
    return new File([await window.apiTester.readFile(dialog.filePaths[0])], 'import.json', { type: 'application/json' })
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}
