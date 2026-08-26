const VARIABLE_PATTERN =
  /(?<!\\)\{\{\s*([^{}]+?)\s*\}\}/g



import {
  getRuntimeVariable,
  hasRuntimeVariable,
} from '../services/scriptRuntime'

import {
  resolveDynamicVariable,
} from '../services/dynamicVariables'






export function getVariableReferences(
  text,
  environment
) {

  if (
    typeof text !== 'string'
  ) {
    return []
  }

  const variables =
    Array.isArray(
      environment?.variables
    )
      ? environment.variables
      : []

  return [
    ...text.matchAll(
      VARIABLE_PATTERN
    ),
  ].map(
    (match) => {

      const key =
        match[1].trim()

      /*
       * =================================================
       * ENVIRONMENT VARIABLE
       * =================================================
       */

      const environmentVariable =
        variables.find(
          (item) =>
            String(
              item?.key ?? ''
            ).trim() === key
        )


      /*
       * =================================================
       * DYNAMIC VARIABLE
       * =================================================
       */

      const dynamicKey =
        key.startsWith('$')
          ? key.substring(1)
          : key

      const dynamicValue =
        resolveDynamicVariable(
          dynamicKey
        )


      /*
       * =================================================
       * RUNTIME VARIABLE
       * =================================================
       */

      let runtimeValue

      if (
        hasRuntimeVariable(
          key
        )
      ) {

        runtimeValue =
          getRuntimeVariable(
            key
          )

      }


      /*
       * =================================================
       * RESOLVE STATUS
       * =================================================
       */

      let status =
        'undefined'

      let value =
        undefined


      /*
       * Disabled environment variable
       * must remain disabled even if a value exists.
       */

      if (
        environmentVariable &&
        environmentVariable.enabled === false
      ) {

        status =
          'disabled'

        value =
          environmentVariable.value

      }


      /*
       * Dynamic variable
       */

      else if (
        dynamicValue !== undefined
      ) {

        status =
          'enabled'

        value =
          dynamicValue

      }


      /*
       * Runtime variable
       */

      else if (
        runtimeValue !== undefined
      ) {

        status =
          'enabled'

        value =
          runtimeValue

      }


      /*
       * Environment variable
       */

      else if (
        environmentVariable &&
        String(
          environmentVariable.value ?? ''
        ).trim() !== ''
      ) {

        status =
          'enabled'

        value =
          environmentVariable.value

      }


      /*
       * Missing / empty
       */

      else {

        status =
          'undefined'

        value =
          environmentVariable?.value

      }


      return {

        key,

        start:
          match.index,

        end:
          match.index +
          match[0].length,

        status,

        value,

      }

    }
  )

}


/*
 * =========================================================
 * VARIABLE AUTOCOMPLETE QUERY
 * =========================================================
 *
 * Supports:
 *
 * {{
 *
 * {{|
 *
 * {{token
 *
 * {{token|
 *
 * {{|}}
 *
 * {{token|}}
 *
 * CodeMirror may automatically insert the closing }}
 * after the cursor.
 *
 * Example:
 *
 *   {{|}}
 *      ^
 *    cursor
 *
 * This is still treated as an active variable expression.
 * =========================================================
 */

export function getAutocompleteQuery(
  document,
  position
) {

  if (
    typeof document !== 'string' ||
    !Number.isFinite(position)
  ) {

    return null

  }


  /*
   * Only inspect a reasonable amount of text
   * before the cursor.
   */

  const beforeCursor =
    document.slice(
      Math.max(
        0,
        position - 200
      ),
      position
    )


  const afterCursor =
    document.slice(
      position,
      Math.min(
        document.length,
        position + 200
      )
    )


  /*
   * Find the nearest {{
   */

  const openIndex =
    beforeCursor.lastIndexOf('{{')


  if (
    openIndex === -1
  ) {

    return null

  }


  /*
   * Text between {{ and cursor.
   *
   * Examples:
   *
   * {{
   *       -> ''
   *
   * {{tok
   *       -> 'tok'
   */

  const variableText =
    beforeCursor.slice(
      openIndex + 2
    )


  /*
   * If another opening or closing brace
   * occurs between {{ and cursor, this is
   * not the variable expression we want.
   */

  if (
    variableText.includes('{') ||
    variableText.includes('}')
  ) {

    return null

  }


  /*
   * Check whether CodeMirror has automatically
   * inserted the closing braces.
   *
   * Example:
   *
   * {{|}}
   *
   */

  const hasClosingBraces =
    afterCursor.startsWith('}}')


  /*
   * Start of the actual variable text.
   *
   * Example:
   *
   * {{tok|
   *    ^
   *
   * start points to 't'
   */

  const start =
    position -
    variableText.length


  /*
   * IMPORTANT:
   *
   * CodeEditor expects:
   *
   * autocomplete.start
   * autocomplete.end
   *
   * NOT from/to.
   */

  return {

    start,

    end:
      position,

    query:
      variableText.trim(),

    hasClosingBraces,

  }

}