import { resolveDynamicVariable } from '../services/dynamicVariables'

/*
 * =========================================================
 * GET VARIABLES AVAILABLE FOR AUTOCOMPLETE
 * =========================================================
 */
export function getAutocompleteVariables(environment) {

  const environmentVariables =
    Array.isArray(environment?.variables)
      ? environment.variables
          .filter(
            (item) =>
              String(item?.key ?? '').trim() !== '' &&
              item?.enabled !== false
          )
          .map((item) => ({
            id:
              `env-${item.id ?? item.key}`,

            key:
              String(item.key).trim(),

            source:
              'Environment',

            value:
              item.value,

            enabled:
              true,
          }))
      : []

  const dynamicKeys = [
    'guid',
    'randomUUID',
    'timestamp',
    'isoTimestamp',
    'randomFirstName',
    'randomLastName',
    'randomCountryCode',
  ]

  const dynamicVariables =
    dynamicKeys.map((key) => ({
      id:
        `dynamic-${key}`,

      key,

      source:
        'Dynamic',

      value:
        resolveDynamicVariable(key),

      enabled:
        true,
    }))

  return [
    ...environmentVariables,
    ...dynamicVariables,
  ]
}


/*
 * =========================================================
 * FILTER VARIABLES
 * =========================================================
 */
export function filterAutocompleteVariables(
  variables,
  query
) {

  const normalizedQuery =
    String(query ?? '')
      .replace(/^\$/, '')
      .trim()
      .toLowerCase()

  return variables.filter(
    (variable) =>
      String(variable?.key ?? '')
        .toLowerCase()
        .startsWith(
          normalizedQuery
        )
  )
}


/*
 * =========================================================
 * FIND VARIABLE AUTOCOMPLETE CONTEXT
 * =========================================================
 *
 * Supports:
 *
 * {{
 * {{bas
 * {{$tim
 * {{base_url}}
 * =========================================================
 */
export function getVariableAutocompleteContext(
  text,
  cursorPosition
) {

  if (
    typeof text !== 'string' ||
    !Number.isFinite(cursorPosition)
  ) {
    return null
  }

  const beforeCursor =
    text.slice(
      0,
      cursorPosition
    )

  const openIndex =
    beforeCursor.lastIndexOf('{{')

  if (
    openIndex === -1
  ) {
    return null
  }

  const closingIndex =
    beforeCursor.lastIndexOf('}}')

  if (
    closingIndex > openIndex
  ) {
    return null
  }

  const textInside =
    beforeCursor.slice(
      openIndex + 2
    )

  if (
    textInside.includes('{') ||
    textInside.includes('}')
  ) {
    return null
  }

  const trimmed =
    textInside.trim()

  const hasDollarPrefix =
    trimmed.startsWith('$')

  const query =
    hasDollarPrefix
      ? trimmed.slice(1)
      : trimmed

  return {
    openIndex,

    query,

    hasDollarPrefix,

    start:
      openIndex + 2,

    end:
      cursorPosition,
  }
}