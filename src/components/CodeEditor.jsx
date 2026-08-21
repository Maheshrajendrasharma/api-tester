
import { useEffect, useMemo, useRef } from 'react'

import {
  EditorView,
  basicSetup,
} from 'codemirror'

import {
  EditorState,
  StateEffect,
  StateField,
  Prec,
} from '@codemirror/state'

import {
  json,
} from '@codemirror/lang-json'

import {
  javascript,
} from '@codemirror/lang-javascript'

import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'

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


/* =========================================================
   CUSTOM API TESTER THEME
   ========================================================= */

const apiTesterTheme = createTheme({
  theme: 'dark',

  settings: {
    background: '#151b21',
    foreground: '#dbe5ee',
    caret: '#6ee7b7',
    selection: '#264f78',
    lineHighlight: '#1b222a',
    gutterBackground: '#151b21',
  },

styles: [

  /* COMMENT */
  {
    tag: t.comment,
    color: '#6a9955',
  },

  /* STRING → ORANGE */
  {
    tag: t.string,
    color: '#CE9178',
  },

  /* NORMAL VARIABLE NAME */
  {
    tag: t.variableName,
    color: '#dbe5ee',
  },

  /* JSON KEY → ORANGE */
  {
    tag: t.propertyName,
    color: '#CE9178',
  },

  /* NUMBER / INTEGER → DARK BLUE */
  {
    tag: t.number,
    color: '#4F81BD',
  },

  /* BOOLEAN */
  {
    tag: t.bool,
    color: '#569CD6',
  },

  /* KEYWORD / NULL */
  {
    tag: t.keyword,
    color: '#C586C0',
  },

],

})



const variableStatusTheme =
  EditorView.theme({

    /* =========================
       RESOLVED VARIABLE
       ========================= */

    '.cm-variable-token-enabled, .cm-variable-token-enabled *': {
      color: '#6ee7b7 !important',
    },

    /* =========================
       UNDEFINED VARIABLE
       ========================= */

    '.cm-variable-token-undefined, .cm-variable-token-undefined *': {
      color: '#f38b91 !important',
    },

    /* =========================
       DISABLED VARIABLE
       ========================= */

    '.cm-variable-token-disabled, .cm-variable-token-disabled *': {
      color: '#8b97a4 !important',
    },

  })







/* =========================================================
   VARIABLE DECORATIONS
   ========================================================= */

const setVariableDecorations =
  StateEffect.define()


const variableDecorationField =
  StateField.define({

    create() {
      return Decoration.none
    },

    update(
      decorations,
      transaction
    ) {

      /*
       * Apply new variable decorations
       */
      for (
        const effect
        of transaction.effects
      ) {

        if (
          effect.is(
            setVariableDecorations
          )
        ) {
          return effect.value
        }

      }

      return decorations

    },

    provide: (field) =>
      EditorView.decorations.from(
        field
      ),

  })
  
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

  /*
   * NEW:
   *
   * Used by the URL editor.
   *
   * false = normal multiline editor
   * true  = single-line editor
   */
  singleLine = false,

  /*
   * NEW:
   *
   * Allows the URL editor to keep its
   * existing url-input styling.
   */
  className = '',
}) {

  const editorParentRef =
    useRef(null)


  const editorViewRef =
    useRef(null)


  const environmentRef =
    useRef(environment)


  /*
   * =========================================================
   * KEEP LATEST ENVIRONMENT
   * =========================================================
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

      /*
       * ENVIRONMENT VARIABLES
       */

      const environmentVariables =
        (
          environment?.variables ??
          []
        )
.filter(
  (item) =>
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

    enabled:
      item.enabled !== false,

  })
)

      /*
       * DYNAMIC VARIABLES
       */

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


      /*
       * SAME VARIABLE SOURCE USED
       * BY CODEMIRROR AUTOCOMPLETE
       */

      return [

        ...environmentVariables,

        ...dynamicVariables,

      ]

    }, [
      environment,
    ])


  /*
   * =========================================================
   * KEEP LATEST VARIABLES AVAILABLE
   * TO THE AUTOCOMPLETE CLOSURE
   * =========================================================
   */

  const variablesRef =
    useRef(
      availableVariables
    )


  variablesRef.current =
    availableVariables


function buildVariableDecorations(
  text,
  variables
) {

  const decorations = []

  const variablePattern =
    /(?<!\\)\{\{\s*([^{}]+?)\s*\}\}/g

  for (
    const match of text.matchAll(variablePattern)
  ) {

    const rawKey =
      match[1].trim()

    /*
     * Support:
     *
     * {{base_url}}
     * {{$timestamp}}
     *
     * Internally lookup "timestamp"
     */

    const key =
      rawKey.startsWith('$')
        ? rawKey.slice(1)
        : rawKey


    const variable =
      variables.find(
        (item) =>
          String(
            item?.key ?? ''
          ).trim() === key
      )


    /*
     * =====================================================
     * VARIABLE STATUS
     * =====================================================
     *
     * GREEN:
     * exists + enabled + has value
     *
     * RED:
     * does not exist
     * OR exists but value is empty
     *
     * GRAY:
     * exists but disabled
     * =====================================================
     */

    let className =
      'cm-variable-token-undefined'


    if (!variable) {

      className =
        'cm-variable-token-undefined'

    } else if (
      variable.enabled === false
    ) {

      className =
        'cm-variable-token-disabled'

    } else if (
      String(
        variable.value ?? ''
      ).trim() === ''
    ) {

      className =
        'cm-variable-token-undefined'

    } else {

      className =
        'cm-variable-token-enabled'

    }


    decorations.push(

      Decoration.mark({

        class:
          className,

      }).range(

        match.index,

        match.index +
          match[0].length

      )

    )

  }


  return Decoration.set(
    decorations,
    true
  )

}


  /*
   * =========================================================
   * VARIABLE AUTOCOMPLETE
   * =========================================================
   *
   * IMPORTANT:
   *
   * This uses the existing
   * getAutocompleteQuery()
   *
   * rather than creating another
   * variable autocomplete system.
   *
   * It supports:
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


    /*
     * FILTER EXISTING VARIABLES
     */

    const matches =
      variablesRef.current.filter(
        (variable) =>
          variable.key
            .toLowerCase()
            .startsWith(query)
      )


    if (
      !matches.length
    ) {

      return null

    }


    /*
     * CODEMIRROR COMPLETION RESULT
     */

    return {

      from:
        autocomplete.start ??
        autocomplete.from ??
        position,

      to:
        autocomplete.end ??
        position,


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


            /*
             * INSERT:
             *
             * {{variable}}
             */
            
            
            
            apply: (view, completion) => {


  const label =
    completion.label


  const state =
    view.state


  const cursor =
    state.selection.main.head


  const text =
    state.doc.toString()


  /*
   Find the last {{
  */

  const before =
    text.slice(
      0,
      cursor
    )


  const start =
    before.lastIndexOf('{{')


  if(start !== -1){


    /*
      Find closing }}

      after cursor
    */

    const after =
      text.slice(
        cursor
      )


    const close =
      after.indexOf('}}')


    const end =
      close !== -1
        ? cursor + close + 2
        : cursor



    const value =
      `{{${label}}}`



    view.dispatch({

      changes: {

        from:
          start,

        to:
          end,

        insert:
          value,

      },


      selection: {

        anchor:
          start +
          value.length,

      },


    })


    return

  }



  /*
    fallback
  */


  const value =
    `{{${label}}}`


  view.dispatch({

    changes: {

      from,

      to,

      insert:
        value,

    },


    selection: {

      anchor:
        from +
        value.length,

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
     * =======================================================
     * JSON
     * =======================================================
     */

    if (
      language === 'json'
    ) {

      languageExtension = [

        json(),

      ]

    }


    /*
     * =======================================================
     * JAVASCRIPT
     * =======================================================
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
     * =======================================================
     * READ ONLY
     * =======================================================
     */

    const readOnlyExtension =
      readOnly
        ? EditorState.readOnly.of(
            true
          )
        : []


    /*
     * =======================================================
     * CHANGE LISTENER
     * =======================================================
     */

    const changeListener =
      EditorView.updateListener.of(
        (update) => {

          if (
            !update.docChanged
          ) {

            return

          }


          const nextValue =
            update.state.doc.toString()

          onChange?.({
  target: {
    value: nextValue,
  },
})

            update.view.dispatch({

  effects:
    setVariableDecorations.of(
      buildVariableDecorations(
        nextValue,
        variablesRef.current
      )
    ),

})
          /*
           * KEEP EXISTING ONCHANGE
           * BEHAVIOUR
           */

 


          /*
           * =================================================
           * AUTO OPEN {{VARIABLE}} AUTOCOMPLETE
           * =================================================
           *
           * CodeMirror may automatically convert:
           *
           * {{
           *
           * into:
           *
           * {{}}
           *
           * with cursor:
           *
           * {{|}}
           *
           * =================================================
           */

          const selection =
            update.state.selection.main


          const position =
            selection.head


          const beforeCursor =
            update.state.doc.sliceString(

              Math.max(
                0,
                position - 2
              ),

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
           * DETECT:
           *
           * {{|}}
           */

          if (
            beforeCursor === '{{' &&
            afterCursor === '}}'
          ) {

            /*
             * Wait until the current
             * CodeMirror update is complete.
             */

            setTimeout(() => {

              try {

if(
 !update.transactions.some(
   tr => tr.isUserEvent(
     'input.complete'
   )
 )
){

 startCompletion(
   update.view
 )

}

              } catch {

                /*
                 * Ignore completion startup
                 * errors.
                 */

              }

            }, 0)

          }

        }
      )


    /*
     * =======================================================
     * PLACEHOLDER
     * =======================================================
     */

    const placeholderExtension =
      placeholder
        ? EditorView.contentAttributes.of({

            'data-placeholder':
              placeholder,

          })
        : []


    /*
     * =======================================================
     * VARIABLE AUTOCOMPLETION
     * =======================================================
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
     * =======================================================
     * LINE WRAPPING
     * =======================================================
     *
     * Normal editors:
     *
     * Body
     * Scripts
     * Response
     *
     * keep line wrapping.
     *
     * URL:
     *
     * singleLine === true
     *
     * does NOT wrap.
     * =======================================================
     */

    const lineWrappingExtension =
      singleLine
        ? []
        : [

            EditorView.lineWrapping,

          ]


    /*
     * =======================================================
     * SINGLE LINE EDITOR
     * =======================================================
     *
     * Prevent Enter from creating additional lines
     * when this CodeEditor is being used for URL.
     *
     * We don't disable Enter globally because the
     * normal Body/Script editors need it.
     * =======================================================
     */

    const singleLineKeymap =
      singleLine
        ? keymap.of([

            {

              key:
                'Enter',

              run: () => true,

            },

          ])
        : []

        /*
 * =========================================================
 * SINGLE-LINE VARIABLE BRACE HANDLER
 * =========================================================
 *
 * CodeMirror basicSetup contains closeBrackets.
 *
 * Without this handler:
 *
 * user types:
 *
 * {{
 *
 * CodeMirror can create:
 *
 * {{}}
 *
 * That conflicts with our {{variable}} autocomplete.
 *
 * For single-line fields only, we therefore insert
 * "{" literally and let the autocomplete insert the
 * complete {{variable}} expression.
 *
 * Body / Script editors are NOT affected.
 * =========================================================
 */

const singleLineVariableBraceHandler =
  singleLine
    ? Prec.highest(
        EditorView.inputHandler.of(
          (
            view,
            from,
            to,
            text
          ) => {

            /*
             * Only intercept "{"
             */

            if (
              text !== '{'
            ) {
              return false
            }


            /*
             * Insert only the opening brace.
             *
             * Do NOT allow closeBrackets to insert
             * the automatic "}".
             */

            view.dispatch({

              changes: {
                from,
                to,
                insert: '{',
              },

              selection: {
                anchor:
                  from + 1,
              },

            })


            /*
             * Tell CodeMirror that we handled
             * the input.
             */

            return true

          }
        )
      )
    : []

    /*
     * =======================================================
     * CREATE STATE
     * =======================================================
     */

    const startState =
      EditorState.create({

        doc:
          value ?? '',


extensions: [

  basicSetup,

  languageExtension,

  variableAutocomplete,

  apiTesterTheme,

  variableDecorationField,

  variableStatusTheme,

  changeListener,

  readOnlyExtension,

  EditorView.editable.of(
    !readOnly
  ),

  placeholderExtension,

  lineWrappingExtension,

  singleLineKeymap,

  singleLineVariableBraceHandler,

],

      })


    /*
     * =======================================================
     * CREATE VIEW
     * =======================================================
     */

    const view =
      new EditorView({

        state:
          startState,

        parent:
          editorParentRef.current,

      })

      view.dispatch({

  effects:
    setVariableDecorations.of(
      buildVariableDecorations(
        view.state.doc.toString(),
        variablesRef.current
      )
    ),

})


    editorViewRef.current =
      view


    /*
     * =======================================================
     * CLEANUP
     * =======================================================
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

  const text =
    view.state.doc.toString()

  view.dispatch({
    effects:
      setVariableDecorations.of(
        buildVariableDecorations(
          text,
          variablesRef.current
        )
      ),
  })

}, [
  environment,
])


  /*
   * =========================================================
   * EXTERNAL VALUE SYNCHRONIZATION
   * =========================================================
   *
   * Important for:
   *
   * - selecting another request
   * - restoring history
   * - switching collections
   * - Beautify
   * - URL changes
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

      ref={
        editorParentRef
      }

      className={
        `code-editor${
          singleLine
            ? ' code-editor-single-line'
            : ''
        }${
          className
            ? ` ${className}`
            : ''
        }`
      }

    />

  )




  

}


export default CodeEditor