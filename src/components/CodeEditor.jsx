import { useEffect, useMemo, useRef } from 'react'

import {
  EditorView,
  basicSetup,
} from 'codemirror'

import {
  EditorState,
  StateEffect,
  StateField,
} from '@codemirror/state'

import {
  json,
} from '@codemirror/lang-json'

import {
  javascript,
} from '@codemirror/lang-javascript'

import {
  oneDark,
} from '@codemirror/theme-one-dark'

import {
  autocompletion,
    completionKeymap,
  startCompletion,
} from '@codemirror/autocomplete'

import {
  Decoration,
  keymap,
} from '@codemirror/view'

import {
  getAutocompleteQuery,
  getVariableReferences,
} from '../utils/variableIntelligence'

import {
  resolveDynamicVariable,
} from '../services/dynamicVariables'


/*
 * =========================================================
 * EFFECT USED TO REFRESH VARIABLE DECORATIONS
 * =========================================================
 */

const refreshVariableDecorations =
  StateEffect.define()


/*
 * =========================================================
 * VARIABLE DECORATION FIELD
 * =========================================================
 */

const variableDecorationField =
  StateField.define({

    create() {
      return Decoration.none
    },

    update(
      decorations,
      transaction
    ) {

      if (
        transaction.docChanged ||
        transaction.effects.some(
          (effect) =>
            effect.is(
              refreshVariableDecorations
            )
        )
      ) {

        return Decoration.none

      }

      return decorations

    },

    provide: (field) =>
      EditorView.decorations.from(
        field
      ),

  })




function getVariableCompletionContext(state, position) {
  const beforeCursor = state.doc.sliceString(
    Math.max(0, position - 200),
    position
  )

  const afterCursor = state.doc.sliceString(
    position,
    Math.min(state.doc.length, position + 200)
  )

  /*
   * Case:
   *
   * {{
   *
   * CodeMirror may automatically produce:
   *
   * {{}}
   *
   * with the cursor here:
   *
   * {{|}}
   */

  const openBracesIndex =
    beforeCursor.lastIndexOf('{{')

  if (openBracesIndex === -1) {
    return null
  }

  /*
   * Make sure there isn't another closing brace
   * between {{ and the cursor.
   */

  const textAfterOpen =
    beforeCursor.slice(openBracesIndex + 2)

  if (
    textAfterOpen.includes('}') ||
    textAfterOpen.includes('{')
  ) {
    return null
  }

  /*
   * If CodeMirror created }} after the cursor,
   * this is still a valid variable expression.
   */

  const hasClosingBraces =
    afterCursor.startsWith('}}')

  /*
   * If there are closing braces after the cursor,
   * accept the expression.
   *
   * If there aren't closing braces, also accept it
   * because the user may be typing:
   *
   * {{token
   */

  const query =
    textAfterOpen.trim()

  const from =
    position - textAfterOpen.length

  return {
    from,
    query,
    hasClosingBraces,
  }
}



/*
 * =========================================================
 * CODE EDITOR
 * =========================================================
 */

function CodeEditor({
  value = '',
  onChange,
  language = 'text',
  environment,
  readOnly = false,
  placeholder = '',
}) {

  const editorParentRef =
    useRef(null)

  const editorViewRef =
    useRef(null)

  const environmentRef =
    useRef(environment)


  /*
   * Keep latest environment available
   * to CodeMirror without recreating
   * the editor.
   */

  environmentRef.current =
    environment


  /*
   * =========================================================
   * AVAILABLE VARIABLES
   * =========================================================
   */

  const availableVariables =
    useMemo(() => {

      const environmentVariables =
        (
          environment?.variables ??
          []
        )
          .filter(
            (item) =>
              item?.enabled !== false &&
              String(
                item?.key ?? ''
              ).trim()
          )
          .map(
            (item) => ({
              id:
                `env-${item.id ?? item.key}`,

              key:
                String(
                  item.key
                ).trim(),

              source:
                'Environment',

              value:
                item.value,
            })
          )


      const dynamicKeys = [
        'guid',
        'timestamp',
        'isoTimestamp',
        'randomFirstName',
        'randomLastName',
      ]


      const dynamicVariables =
        dynamicKeys.map(
          (key) => ({
            id:
              `dynamic-${key}`,

            key,

            source:
              'Dynamic',

            value:
              resolveDynamicVariable(
                key
              ),
          })
        )


      return [
        ...environmentVariables,
        ...dynamicVariables,
      ]

    }, [
      environment,
    ])


  /*
   * Keep latest variables available
   * to the autocomplete closure.
   */

  const variablesRef =
    useRef(
      availableVariables
    )

  variablesRef.current =
    availableVariables


  /*
   * =========================================================
   * VARIABLE AUTOCOMPLETE
   * =========================================================
   */

  function variableCompletionSource(
    context
  ) {

    const document =
      context.state.doc.toString()

    const position =
      context.pos


    const autocomplete =
      getAutocompleteQuery(
        document,
        position
      )


    /*
     * User is not currently typing
     * a variable expression.
     */

    if (!autocomplete) {
      return null
    }


    const query =
      String(
        autocomplete.query ?? ''
      ).toLowerCase()


    const matches =
      variablesRef.current.filter(
        (variable) =>
          variable.key
            .toLowerCase()
            .startsWith(query)
      )


    if (!matches.length) {
      return null
    }


    return {

      from:
        autocomplete.start,

      to:
        autocomplete.end,

      options:
        matches.map(
          (variable) => ({

            label:
              variable.key,

            detail:
              variable.source,

            type:
              variable.source ===
              'Dynamic'
                ? 'keyword'
                : 'variable',

            apply:
              (
                view,
                completion,
                from,
                to
              ) => {

                const replacement =
                  `{{${completion.label}}}`


                view.dispatch({

                  changes: {

                    from,

                    to,

                    insert:
                      replacement,

                  },

                  selection: {

                    anchor:
                      from +
                      replacement.length,

                  },

                })

              },

          })
        ),

    }

  }


  /*
   * =========================================================
   * CREATE EDITOR
   * =========================================================
   */

  useEffect(() => {

    if (
      !editorParentRef.current
    ) {
      return
    }


    let languageExtension =
      []


    /*
     * JSON
     */

    if (
      language === 'json'
    ) {

      languageExtension = [
        json(),
      ]

    }


    /*
     * JAVASCRIPT
     */

    else if (
      language === 'javascript' ||
      language === 'js'
    ) {

      languageExtension = [
        javascript(),
      ]

    }


    /*
     * READ ONLY
     */

    const readOnlyExtension =
      readOnly
        ? EditorState.readOnly.of(
            true
          )
        : []


    /*
     * CHANGE LISTENER
     */

const changeListener =
  EditorView.updateListener.of(
    (update) => {

      if (!update.docChanged) {
        return
      }


      const nextValue =
        update.state.doc.toString()


      /*
       * Keep existing onChange behavior.
       */

      onChange?.({
        target: {
          value: nextValue,
        },
      })


      /*
       * =====================================================
       * AUTO OPEN {{VARIABLE}} AUTOCOMPLETE
       * =====================================================
       */

      const selection =
        update.state.selection.main

      const position =
        selection.head


      const beforeCursor =
        update.state.doc.sliceString(
          Math.max(0, position - 2),
          position
        )


      const afterCursor =
        update.state.doc.sliceString(
          position,
          Math.min(
            update.state.doc.length,
            position + 2
          )
        )


      /*
       * Detect:
       *
       * {{|}}
       *
       * This is the situation created by
       * CodeMirror's automatic bracket closing.
       */

      if (
        beforeCursor === '{{' &&
        afterCursor === '}}'
      ) {

        /*
         * Wait until CodeMirror finishes
         * processing the current update.
         */

        setTimeout(() => {

          try {

            startCompletion(
              update.view
            )

          } catch {
            // Ignore completion startup errors.
          }

        }, 0)

      }

    }
  )


    /*
     * PLACEHOLDER
     */

    const placeholderExtension =
      placeholder
        ? EditorView.contentAttributes.of({

            'data-placeholder':
              placeholder,

          })
        : []


    /*
     * VARIABLE AUTOCOMPLETION
     */

    const variableAutocomplete =
      autocompletion({

        activateOnTyping:
          true,

        override: [
          variableCompletionSource,
        ],

        defaultKeymap:
          true,

      })


    /*
     * CREATE STATE
     */

    const startState =
      EditorState.create({

        doc:
          value ?? '',

        extensions: [

          basicSetup,

          oneDark,

          languageExtension,

          variableAutocomplete,

          variableDecorationField,

          changeListener,

          readOnlyExtension,

          EditorView.editable.of(
            !readOnly
          ),

          placeholderExtension,

          EditorView.lineWrapping,

        ],

      })


    /*
     * CREATE VIEW
     */

    const view =
      new EditorView({

        state:
          startState,

        parent:
          editorParentRef.current,

      })


    editorViewRef.current =
      view


    /*
     * CLEANUP
     */

    return () => {

      view.destroy()

      editorViewRef.current =
        null

    }

  }, [])


  /*
   * =========================================================
   * ENVIRONMENT CHANGE
   * =========================================================
   */

  useEffect(() => {

    const view =
      editorViewRef.current

    if (!view) {
      return
    }


    view.dispatch({

      effects:
        refreshVariableDecorations.of(
          null
        ),

    })

  }, [
    environment,
  ])


  /*
   * =========================================================
   * EXTERNAL VALUE SYNCHRONIZATION
   * =========================================================
   */

  useEffect(() => {

    const view =
      editorViewRef.current

    if (!view) {
      return
    }


    const currentValue =
      view.state.doc.toString()

    const nextValue =
      value ?? ''


    if (
      currentValue ===
      nextValue
    ) {
      return
    }


    view.dispatch({

      changes: {

        from:
          0,

        to:
          view.state.doc.length,

        insert:
          nextValue,

      },

    })

  }, [
    value,
  ])


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (

    <div
      ref={editorParentRef}
      className="code-editor"
    />

  )

}


export default CodeEditor