const supportedMethods = new Set([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS'
])

const activeRequestControllers = new Map()



function resolveEnvironmentVariables(value, environment) {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value !== 'string') {
    return value
  }

  const variables =
    Array.isArray(environment?.variables)
      ? environment.variables
      : []

  return value.replace(
    /\{\{\s*([^{}]+?)\s*\}\}/g,
    (fullMatch, variableName) => {

      const key =
        String(variableName).trim()

      const variable =
        variables.find(
          (item) =>
            item?.enabled !== false &&
            String(item?.key ?? '').trim() === key
        )

      if (!variable) {
        return fullMatch
      }

      return String(
        variable.value ?? ''
      )
    }
  )
}













function applyAuthorization(
  headers,
  parsedUrl,
  authorization,
  environment
) {

  if (!authorization || authorization.type === 'None') {
    return
  }

  // ---------------------------------------
  // Bearer Token
  // ---------------------------------------

  if (
    authorization.type === 'Bearer Token' &&
    authorization.bearerToken
  ) {
    headers.Authorization =
      `Bearer ${String(authorization.bearerToken).trim()}`
  }

  // ---------------------------------------
  // Basic Auth
  // ---------------------------------------

  if (
    authorization.type === 'Basic Auth' &&
    (authorization.username || authorization.password)
  ) {

    const username =
      String(authorization.username ?? '')

    const password =
      String(authorization.password ?? '')

    headers.Authorization =
      `Basic ${Buffer.from(
        `${username}:${password}`
      ).toString('base64')}`
  }

  // ---------------------------------------
  // API Key
  // ---------------------------------------

  if (
    authorization.type === 'API Key' &&
    authorization.apiKey
  ) {

    const apiKeyName =
      String(authorization.apiKey).trim()

const apiKeyValue =
  resolveEnvironmentVariables(
    String(authorization.apiValue ?? ''),
    environment
  )

    if (!apiKeyName) {
      return
    }

    if (
      authorization.apiKeyLocation ===
      'Query Parameter'
    ) {

      parsedUrl.searchParams.set(
        apiKeyName,
        apiKeyValue
      )

    } else {

      headers[apiKeyName] =
        apiKeyValue

    }
  }
}

/**
 * Convert HeadersEditor data into a real
 * fetch-compatible headers object.
 *
 * UI format:
 *
 * [
 *   {
 *     id: 1,
 *     enabled: true,
 *     key: "Content-Type",
 *     value: "application/json"
 *   }
 * ]
 *
 * becomes:
 *
 * {
 *   "Content-Type": "application/json"
 * }
 */























function buildHeaders(headers) {
  const result = {}

  // Your UI stores headers as an array
  if (Array.isArray(headers)) {
    for (const header of headers) {
      if (!header) {
        continue
      }

      // Ignore disabled headers
      if (header.enabled === false) {
        continue
      }

      const key = String(header.key ?? '').trim()

      if (!key) {
        continue
      }

      const value = String(header.value ?? '')

      result[key] = value
    }

    return result
  }

  // Fallback in case some older request was saved
  // using an object instead of an array.
  if (headers && typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      if (!key) {
        continue
      }

      result[key] = String(value ?? '')
    }
  }

  return result
}

export async function execute(request) {
  const {
    method,
    url,
    headers = [],
    body = '',
    authorization,
    __requestId,
  } = request ?? {}

  console.log('================================')
  console.log('API REQUEST')
  console.log('METHOD:', method)
  console.log('URL:', url)
  console.log('RAW HEADERS:', headers)
  console.log('BODY:', body)
  console.log('AUTHORIZATION:', authorization)
  console.log('================================')

  // ---------------------------------------
  // Validate method
  // ---------------------------------------

  if (!supportedMethods.has(method)) {
    throw new Error(`Unsupported HTTP method: ${method}`)
  }

  // ---------------------------------------
  // Validate URL
  // ---------------------------------------

  let parsedUrl

  try {
    parsedUrl = new URL(url)
  } catch (error) {
    console.error('INVALID URL:', url)

    throw new Error(
      `Please enter a valid request URL: ${url}`
    )
  }

  if (
    !['http:', 'https:'].includes(
      parsedUrl.protocol
    )
  ) {
    throw new Error(
      'Only HTTP and HTTPS URLs are supported.'
    )
  }

  // ---------------------------------------
  // Build proper headers
  // ---------------------------------------

  const requestHeaders = buildHeaders(headers)

  // ---------------------------------------
  // Apply Authorization
  // ---------------------------------------

applyAuthorization(
    requestHeaders,
    parsedUrl,
    authorization,
    request.environment
)
  console.log(
    'FINAL URL:',
    parsedUrl.toString()
  )

  console.log(
    'FINAL HEADERS:',
    requestHeaders
  )

  // ---------------------------------------
  // Build fetch options
  // ---------------------------------------

  const requestOptions = {
    method,
    headers: requestHeaders,
  }

  // ---------------------------------------
  // Add body
  // ---------------------------------------

  if (
    body &&
    method !== 'GET'
  ) {
    requestOptions.body = body
  }

  console.log(
    'FETCH OPTIONS:',
    requestOptions
  )

// ---------------------------------------
// Execute request
// ---------------------------------------

const startedAt =
    performance.now()

const controller =
    new AbortController()

if (__requestId) {

    activeRequestControllers.set(
        __requestId,
        controller
    )
}

try {

    const response =
        await fetch(
            parsedUrl,
            {
                ...requestOptions,
                signal: controller.signal,
            }
        )


    // ---------------------------------------
    // Read response
    // ---------------------------------------

    const responseBody =
        await response.text()


    return {

        status:
            response.status,

        statusText:
            response.statusText,

        headers:
            Object.fromEntries(
                response.headers.entries()
            ),

        responseBody,

        responseTime:
            Math.round(
                performance.now() - startedAt
            ),

        responseSize:
            Buffer.byteLength(
                responseBody,
                'utf8'
            ),

    }

} catch (error) {

    if (
        error?.name === 'AbortError'
    ) {

        throw error
    }

    throw new Error(
        `Request failed: ${
            error?.cause?.message ||
            error?.message ||
            'Unknown network error'
        }`
    )

} finally {

    if (__requestId) {

        activeRequestControllers.delete(
            __requestId
        )

    }

  }

}

export function cancelRequest(requestId) {

    console.log(
        "[CANCEL SERVICE] requestId =",
        requestId
    )

    if (!requestId) {

        console.log(
            "[CANCEL SERVICE] No requestId"
        )

        return false
    }

    const controller =
        activeRequestControllers.get(
            requestId
        )

    console.log(
        "[CANCEL SERVICE] controller found =",
        !!controller
    )

    if (!controller) {
        return false
    }

    controller.abort()

    console.log(
        "[CANCEL SERVICE] controller.abort() called"
    )

    activeRequestControllers.delete(
        requestId
    )

    return true
}