const PLACEHOLDER_PATTERN = /(?<!\\)\{\{\s*([^{}]+?)\s*\}\}/g
const ENCODED_PLACEHOLDER_PATTERN = /(?<!%5C)%7B%7B\s*([^%{}]+?)\s*%7D%7D/gi

function resolveValue(value, environment, resolutions) {
  if (typeof value !== 'string') return value

  return value.replace(PLACEHOLDER_PATTERN, (placeholder, key) => {
    const resolvedValue = getVariable(environment, key.trim())

    if (resolvedValue === undefined) return placeholder

    const replacement = String(resolvedValue)
    resolutions?.push({ placeholder, replacement })
    return replacement
  })
}

function resolveUrl(value, environment, resolutions) {
  const resolvedUrl = resolveValue(value, environment, resolutions)
  if (typeof resolvedUrl !== 'string') return resolvedUrl

  return resolvedUrl.replace(ENCODED_PLACEHOLDER_PATTERN, (placeholder, key) => {
    const resolvedValue = getVariable(environment, key.trim())

    if (resolvedValue === undefined) return placeholder

    const replacement = String(resolvedValue)
    resolutions?.push({ placeholder, replacement })
    return encodeURIComponent(replacement)
  })
}

function resolveHeaders(headers, environment, resolutions) {
  if (Array.isArray(headers)) {
    return headers.map((header) => ({
      ...header,
      key: resolveValue(header.key, environment, resolutions),
      value: resolveValue(header.value, environment, resolutions),
    }))
  }

  if (headers && typeof headers === 'object') {
    return Object.fromEntries(Object.entries(headers).map(([key, value]) => ([
      resolveValue(key, environment, resolutions),
      resolveValue(value, environment, resolutions),
    ])))
  }

  return headers
}

function logResolutions(resolutions, options) {
  if (!options?.debug || typeof options.logger?.debug !== 'function') return
  resolutions.forEach(({ placeholder, replacement }) => options.logger.debug(`${placeholder} → ${replacement}`))
}

export function findVariables(text) {
  if (typeof text !== 'string') return []

  return [...new Set([...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1].trim()))]
}

export function getVariable(environment, key) {
  if (!environment || !key || !Array.isArray(environment.variables)) return undefined

  const variable = environment.variables.find((item) => item?.enabled !== false && item.key === key)
  return variable?.value
}

export function resolveVariables(text, environment, options) {
  const resolutions = []
  const resolvedText = resolveValue(text, environment, resolutions)
  logResolutions(resolutions, options)
  return resolvedText
}

export function resolveRequest(request, environment, options) {
  if (!request || !environment) return request

  const resolutions = []
  const authorization = request.authorization && typeof request.authorization === 'object'
    ? Object.fromEntries(Object.entries(request.authorization).map(([key, value]) => [key, resolveValue(value, environment, resolutions)]))
    : request.authorization

  const resolvedRequest = {
    ...request,
    url: resolveUrl(request.url, environment, resolutions),
    params: Array.isArray(request.params)
      ? request.params.map((parameter) => ({
        ...parameter,
        key: resolveValue(parameter.key, environment, resolutions),
        value: resolveValue(parameter.value, environment, resolutions),
      }))
      : request.params,
    headers: resolveHeaders(request.headers, environment, resolutions),
    authorization,
    body: resolveValue(request.body, environment, resolutions),
  }

  logResolutions(resolutions, options)
  return resolvedRequest
}
