import { hasHeaderKey } from './validators'

export function getActiveParameters(parameters) {
  return parameters.filter((parameter) => parameter.enabled && parameter.key.trim())
}

export function getRequestHeaders(headers) {
  return headers.reduce((result, header) => {
    if (hasHeaderKey(header)) result[header.key.trim()] = header.value
    return result
  }, {})
}

export function removeGeneratedParameters(searchParams, generatedParameters) {
  for (const parameter of generatedParameters) {
    const values = searchParams.getAll(parameter.key)
    const generatedValueIndex = values.indexOf(parameter.value)

    if (generatedValueIndex !== -1) {
      searchParams.delete(parameter.key)
      values.filter((_, index) => index !== generatedValueIndex).forEach((value) => searchParams.append(parameter.key, value))
    }
  }
}
