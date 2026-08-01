const supportedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

function applyAuthorization(headers, parsedUrl, authorization) {
  if (!authorization || authorization.type === 'None') return

  if (authorization.type === 'Bearer Token' && authorization.bearerToken) {
    headers.Authorization = `Bearer ${authorization.bearerToken}`
  }

  if (authorization.type === 'Basic Auth' && (authorization.username || authorization.password)) {
    headers.Authorization = `Basic ${Buffer.from(`${authorization.username}:${authorization.password}`).toString('base64')}`
  }

  if (authorization.type === 'API Key' && authorization.apiKey) {
    if (authorization.apiKeyLocation === 'Query Parameter') {
      parsedUrl.searchParams.set(authorization.apiKey, authorization.apiValue ?? '')
    } else {
      headers[authorization.apiKey] = authorization.apiValue ?? ''
    }
  }
}

export async function execute(request) {
  const { method, url, headers = {}, body = '', authorization } = request ?? {}

  if (!supportedMethods.has(method)) throw new Error('Unsupported HTTP method.')

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('Please enter a valid request URL.')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.')

  const requestHeaders = { ...headers }
  applyAuthorization(requestHeaders, parsedUrl, authorization)

  const requestOptions = { method, headers: requestHeaders }
  if (body && method !== 'GET') requestOptions.body = body

  const startedAt = performance.now()
  const response = await fetch(parsedUrl, requestOptions)
  const responseBody = await response.text()

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    responseBody,
    responseTime: Math.round(performance.now() - startedAt),
    responseSize: Buffer.byteLength(responseBody, 'utf8'),
  }
}
