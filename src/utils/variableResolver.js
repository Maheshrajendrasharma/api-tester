  import {
      getRuntimeVariable,
      hasRuntimeVariable,
  } from "../services/scriptRuntime"

  import {
resolveDynamicVariable
}
from "../services/dynamicVariables"


  const PLACEHOLDER_PATTERN = /(?<!\\)\{\{\s*([^{}]+?)\s*\}\}/g
  const ENCODED_PLACEHOLDER_PATTERN = /(?<!%5C)%7B%7B\s*([^%{}]+?)\s*%7D%7D/gi

  function getVariableValue(environment, key) {

      const normalizedKey =
          key.trim()



// ===============================
// 1. Dynamic Variables
// ===============================

// ===============================
// 1. DYNAMIC VARIABLES
// ===============================

const dynamicKey =
    normalizedKey.startsWith("$")
        ? normalizedKey.substring(1)
        : normalizedKey

const dynamicValue =
    resolveDynamicVariable(
        dynamicKey
    )

if (dynamicValue !== undefined) {

    console.log(
        "[VARIABLE] DYNAMIC:",
        normalizedKey,
        "=>",
        dynamicValue
    )

    return dynamicValue
}



      // =================================================
      // 1. RUNTIME VARIABLE
      // =================================================

      if (
          hasRuntimeVariable(
              normalizedKey
          )
      ) {

          return getRuntimeVariable(
              normalizedKey
          )

      }


      // =================================================
      // 2. ENVIRONMENT VARIABLE
      // =================================================

      if (
          !environment ||
          !Array.isArray(
              environment.variables
          )
      ) {

          return undefined

      }


      const variable =
          environment.variables.find(
              (item) => (
                  item?.enabled !== false &&
                  String(
                      item.key ?? ''
                  ).trim() === normalizedKey
              )
          )


if (
    !variable ||
    variable.value === undefined ||
    variable.value === null ||
    String(variable.value).trim() === ''
) {
    return undefined
}

return variable.value

  }

  function resolveText(value, environment) {
    if (typeof value !== 'string') return value

    return value.replace(PLACEHOLDER_PATTERN, (placeholder, key) => {
      const variableValue = getVariableValue(environment, key)
      return variableValue === undefined ? placeholder : String(variableValue)
    })
  }





  function resolveUrl(value, environment) {
    const resolvedUrl = resolveText(value, environment)
    if (typeof resolvedUrl !== 'string') return resolvedUrl

    return resolvedUrl.replace(ENCODED_PLACEHOLDER_PATTERN, (placeholder, key) => {
      const variableValue = getVariableValue(environment, key)
      return variableValue === undefined ? placeholder : encodeURIComponent(String(variableValue))
    })
  }


/*
=======================================================
FIND UNRESOLVED VARIABLES
=======================================================
*/


export function findUnresolvedVariables(text) {

    if (typeof text !== 'string') {
        return []
    }

    const unresolved = []

    const pattern =
        /(?<!\\)\{\{\s*([^{}]+?)\s*\}\}/g

    const lines =
        text.split('\n')


    lines.forEach(
        (line, lineIndex) => {

            let match

            while (
                (match = pattern.exec(line)) !== null
            ) {

                const key =
                    match[1].trim()


                const startIndex =
                    match.index


                const column =
                    startIndex + 1


                unresolved.push({

                    key,

                    placeholder:
                        match[0],

                    line:
                        lineIndex + 1,

                    column,

                })

            }

        }
    )


    return unresolved

}


  function resolveHeaders(headers, environment) {
    if (Array.isArray(headers)) {
      return headers.map((header) => ({
        ...header,
        key: resolveText(header.key, environment),
        value: resolveText(header.value, environment),
      }))
    }

    if (headers && typeof headers === 'object') {
      return Object.fromEntries(Object.entries(headers).map(([key, value]) => ([
        resolveText(key, environment),
        resolveText(value, environment),
      ])))
    }

    return headers
  }

  export function resolveVariables(text, environment) {
    return resolveText(text, environment)
  }

  export function resolveRequest(request, environment) {
    if (!request || typeof request !== 'object') return request

    return {
      ...request,
      url: resolveUrl(request.url, environment),
      params: Array.isArray(request.params)
        ? request.params.map((parameter) => ({
          ...parameter,
          key: resolveText(parameter.key, environment),
          value: resolveText(parameter.value, environment),
        }))
        : request.params,
      headers: resolveHeaders(request.headers, environment),
      authorization: request.authorization && typeof request.authorization === 'object'
        ? Object.fromEntries(Object.entries(request.authorization).map(([key, value]) => [key, resolveText(value, environment)]))
        : request.authorization,
      body: resolveText(request.body, environment),
    }
  }
