import { useEffect, useMemo, useRef } from 'react'
import Editor from '@monaco-editor/react'

import {
  resolveDynamicVariable,
} from '../services/dynamicVariables'

import {
  getVariableReferences,
 } from '../utils/variableIntelligence'


 import {
  getAutocompleteVariables,
  filterAutocompleteVariables,
  getVariableAutocompleteContext,
} from '../utils/variableAutocomplete'

/*
 * =========================================================
 * MONACO THEME
 * =========================================================
 */

const API_TESTER_THEME = 'api-tester-dark'










function defineApiTesterTheme(monaco) {

  monaco.editor.defineTheme(
    API_TESTER_THEME,
    {
      base: 'vs-dark',

      inherit: true,

rules: [
  {
    token: 'comment',
    foreground: '6A9955',
  },

  // JSON keys
  {
    token: 'string.key.json',
    foreground: '6FC9FF',
  },

  // JSON string values
  {
    token: 'string.value.json',
    foreground: 'FFFFFF',
  },

  // Normal strings / fallback
  {
    token: 'string',
    foreground: 'FFFFFF',
  },

  {
    token: 'number',
    foreground: '4F81BD',
  },

  {
    token: 'keyword',
    foreground: 'C586C0',
  },

  {
    token: 'type',
    foreground: '9CDCFE',
  },

  {
    token: 'variable',
    foreground: 'DBE5EE',
  },
],

      colors: {
        'editor.background': '#151B21',

        'editor.foreground': '#DBE5EE',

        'editorCursor.foreground': '#6EE7B7',

        'editor.selectionBackground': '#264F78',

        'editor.inactiveSelectionBackground':
          '#264F78',

        'editor.lineHighlightBackground':
          '#1B222A',

        'editorLineNumber.foreground':
          '#667384',

        'editorLineNumber.activeForeground':
          '#DBE5EE',

        'editorGutter.background':
          '#151B21',

        'editorIndentGuide.background':
          '#2C3640',

        'editorIndentGuide.activeBackground':
          '#465462',

        'editorBracketMatch.background':
          '#26384A',

        'editorBracketMatch.border':
          '#6EE7B7',

        'editorHoverWidget.background':
          '#111820',

        'editorHoverWidget.border':
          '#394653',

        'editorSuggestWidget.background':
          '#111820',

        'editorSuggestWidget.border':
          '#394653',

        'editorSuggestWidget.foreground':
          '#DBE5EE',

        'editorSuggestWidget.selectedBackground':
          '#243B55',

        'editorWhitespace.foreground':
          '#2C3640',
      },
    }
  )

}


/*
 * =========================================================
 * LANGUAGE NORMALIZATION
 * =========================================================
 */

function normalizeLanguage(language) {

  if (
    language === 'js' ||
    language === 'javascript'
  ) {
    return 'javascript'
  }

  if (language === 'json') {
    return 'json'
  }

  return 'plaintext'
}


/*
 * =========================================================
 * VARIABLE HELPERS
 * =========================================================
 */

function getEnvironmentVariables(
  environment
) {

  const variables =
    Array.isArray(
      environment?.variables
    )
      ? environment.variables
      : []


  return variables
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
}


/*
 * =========================================================
 * DYNAMIC VARIABLES
 * =========================================================
 */







function getDynamicVariables() {

  return [
    'guid',
    'randomUUID',
    'timestamp',
    'isoTimestamp',
    'randomFirstName',
    'randomLastName',
    'randomCountryCode',
  ]

}





/*
 * =========================================================
 * BUILD AUTOCOMPLETE VARIABLES
 * =========================================================
 */

function buildAvailableVariables(
  environment
) {

  const environmentVariables =
    getEnvironmentVariables(
      environment
    )


  const dynamicVariables =
    getDynamicVariables().map(
      (key) => ({
        id:
          `dynamic-${key}`,

        key,

        source:
          'Dynamic',

        value:
  resolveDynamicVariable(key),
        
        enabled:
          true,
      })
    )


  return [
    ...environmentVariables,
    ...dynamicVariables,
  ]
}


/*
 * =========================================================
 * FIND VARIABLE EXPRESSION
 * =========================================================
 *
 * Supports:
 *
 * {{
 * {{|
 * {{$timestamp
 * {{base_url
 *
 * =========================================================
 */

function getVariableStart(
  lineText,
  cursorColumn
) {

  const beforeCursor =
    lineText.slice(
      0,
      Math.max(
        0,
        cursorColumn - 1
      )
    )

  const openIndex =
    beforeCursor.lastIndexOf('{{')

  if (
    openIndex === -1
  ) {
    return null
  }

  const closeIndex =
    beforeCursor.lastIndexOf('}}')

  /*
   * The latest closing braces occur after
   * the latest opening braces, so we are not
   * currently inside a variable expression.
   */
  if (
    closeIndex > openIndex
  ) {
    return null
  }

  /*
   * Don't allow another opening brace between
   * {{ and the cursor.
   */
  const variableText =
    beforeCursor.slice(
      openIndex + 2
    )

  if (
    variableText.includes('{') ||
    variableText.includes('}')
  ) {
    return null
  }

  return openIndex
}








/*
 * =========================================================
 * CODE EDITOR
 * =========================================================
 */

export default function CodeEditor({



  value = '',

  onChange,

  language = 'text',

  environment,

  readOnly = false,

  placeholder = '',

  singleLine = false,

  className = '',

}) {

const editorRef =
  useRef(null)

const monacoRef =
  useRef(null)

const variableDecorationIdsRef =
  useRef([])

const completionProviderRef =
  useRef(null)

const environmentRef =
  useRef(environment)
  /*
   * Keep latest environment available
   * to the completion provider.
   */

  environmentRef.current =
    environment





  /*
   * =========================================================
   * AUTOCOMPLETE DATA
   * =========================================================
   */

  const availableVariables =
    useMemo(
      () =>
        buildAvailableVariables(
          environment
        ),
      [
        environment,
      ]
    )


  const variablesRef =
    useRef(
      availableVariables
    )


  variablesRef.current =
    availableVariables


  function handleChange(nextValue) {

  onChange?.({
    target: {
      value: nextValue ?? '',
    },
  })

  requestAnimationFrame(() => {
    updateVariableDecorations()
  })

}


  function updateVariableDecorations() {

  const editor =
    editorRef.current

  if (!editor) {
    return
  }

  const model =
    editor.getModel()

  if (!model) {
    return
  }

  const references =
    getVariableReferences(
      model.getValue(),
      environmentRef.current
    )

  const decorations =
    references.map(
      (reference) => {

        const startPosition =
          model.getPositionAt(
            reference.start
          )

        const endPosition =
          model.getPositionAt(
            reference.end
          )

        let className =
          'api-variable-undefined'

        if (
          reference.status === 'enabled'
        ) {
          className =
            'api-variable-enabled'
        } else if (
          reference.status === 'disabled'
        ) {
          className =
            'api-variable-disabled'
        }

        return {
          range: {
            startLineNumber:
              startPosition.lineNumber,

            startColumn:
              startPosition.column,

            endLineNumber:
              endPosition.lineNumber,

            endColumn:
              endPosition.column,
          },

          options: {
            inlineClassName:
              className,
          },
        }
      }
    )

  variableDecorationIdsRef.current =
    editor.deltaDecorations(
      variableDecorationIdsRef.current,
      decorations
    )
}


  /*
   * =========================================================
   * MONACO MOUNT
   * =========================================================
   */

  function handleEditorMount(
    editor,
    monaco
  ) {

    editorRef.current =
      editor

    monacoRef.current =
      monaco

requestAnimationFrame(() => {

  updateVariableDecorations()

})
    /*
     * =======================================================
     * THEME
     * =======================================================
     */

    defineApiTesterTheme(
      monaco
    )

    monaco.editor.setTheme(
      API_TESTER_THEME
    )


    /*
     * =======================================================
     * COMPLETION PROVIDER
     * =======================================================
     */


completionProviderRef.current =
  monaco.languages.registerCompletionItemProvider(
    normalizeLanguage(language),
    {

      /*
       * Open autocomplete immediately when
       * the second { is typed.
       */
      triggerCharacters: [
        '{',
      ],

provideCompletionItems(
  model,
  position
) {

  const fullText =
    model.getValue()

  const cursorOffset =
    model.getOffsetAt(position)

  const context =
    getVariableAutocompleteContext(
      fullText,
      cursorOffset
    )

  if (!context) {
    return {
      suggestions: [],
    }
  }

  const variables =
    getAutocompleteVariables(
      environmentRef.current
    )

  const matches =
    filterAutocompleteVariables(
      variables,
      context.query
    )

  if (!matches.length) {
    return {
      suggestions: [],
    }
  }

  const queryStartOffset =
    context.openIndex +
    2 +
    (
      context.hasDollarPrefix
        ? 1
        : 0
    )

  const startPosition =
    model.getPositionAt(
      queryStartOffset
    )

  const range = {

    startLineNumber:
      startPosition.lineNumber,

    startColumn:
      startPosition.column,

    endLineNumber:
      position.lineNumber,

    endColumn:
      position.column,

  }

  return {

    suggestions:
      matches.map(
        (variable) => ({

          label:
            context.hasDollarPrefix
              ? `$${variable.key}`
              : variable.key,

          kind:
            monaco.languages
              .CompletionItemKind
              .Reference,

          detail:
            variable.source === 'Dynamic'
              ? 'Dynamic variable'
              : 'Environment variable',

          insertText:
            `${variable.key}}}`,

          range,

        })
      ),

  }
},

    }
  )


    /*
     * =======================================================
     * SINGLE-LINE SETTINGS
     * =======================================================
     */

    editor.updateOptions({

      readOnly,


      
      wordWrap:
        singleLine
          ? 'off'
          : 'on',

      lineNumbers:
        'on',

      minimap: {
        enabled: false,
      },

      folding: true,

      automaticLayout: true,

      scrollBeyondLastLine:
        false,

      renderWhitespace:
        'selection',

      cursorBlinking:
        'blink',

      cursorStyle:
        'line',

      fontFamily:
        'Consolas, "Courier New", monospace',

      fontSize:
        14,

      lineHeight:
        21,

      padding: {
        top: 8,
        bottom: 8,
      },

      /*
       * Keep normal body/script editor
       * behaviour.
       *
       * URL editor is single line.
       */

      autoClosingBrackets:
        singleLine
          ? 'never'
          : 'always',

      autoClosingQuotes:
        singleLine
          ? 'never'
          : 'always',

      matchBrackets:
        'always',


    })


    /*
     * =======================================================
     * PLACEHOLDER
     * =======================================================
     *
     * Monaco doesn't have the same simple placeholder
     * API as a textarea. We preserve the existing
     * data-placeholder mechanism on the wrapper.
     *
     * =======================================================
     */

    const wrapper =
      editor.getDomNode()
        ?.parentElement


    if (
      wrapper &&
      placeholder
    ) {

      wrapper.setAttribute(
        'data-placeholder',
        placeholder
      )

    }


    /*
     * =======================================================
     * INITIAL LAYOUT
     * =======================================================
     */

    requestAnimationFrame(
      () => {

        editor.layout()

      }
    )

  }


  /*
   * =========================================================
   * VALUE CHANGES
   * =========================================================
   */

  
  /*
   * =========================================================
   * EXTERNAL VALUE SYNCHRONIZATION
   * =========================================================
   */

  useEffect(
    () => {

      const editor =
        editorRef.current


      if (!editor) {
        return
      }


      const currentValue =
        editor.getValue()


      const nextValue =
        value ?? ''


      if (
        currentValue ===
        nextValue
      ) {
        return
      }


      /*
       * Preserve cursor/selection as much as
       * Monaco allows when external value changes.
       */

      const selection =
        editor.getSelection()


      editor.executeEdits(
        'external-value',
        [
          {
            range:
              editor.getModel()
                ?.getFullModelRange(),

            text:
              nextValue,

            forceMoveMarkers:
              true,

          },
        ]
      )


      if (selection) {

        try {

          editor.setSelection(
            selection
          )

        } catch {

          /*
           * Ignore invalid restored selections
           * if the new document is shorter.
           */

        }

      }

    },
    [
      value,
    ]
  )


  /*
   * =========================================================
   * ENVIRONMENT CHANGE
   * =========================================================
   *
   * We don't decorate variables.
   *
   * We only update the autocomplete data.
   * This means:
   *
   * {{$timestamp}}
   *
   * remains normal text until the user selects/
   * interacts with it.
   *
   * =========================================================
   */

useEffect(
  () => {

    variablesRef.current =
      buildAvailableVariables(
        environment
      )

    requestAnimationFrame(() => {

      updateVariableDecorations()

    })

  },
  [
    environment,
  ]
)


  /*
   * =========================================================
   * CLEANUP
   * =========================================================
   */

  useEffect(
    () => {

      return () => {

        completionProviderRef
          .current
          ?.dispose()

        completionProviderRef.current =
          null

        editorRef.current =
          null

        monacoRef.current =
          null

      }

    },
    []
  )


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  const monacoLanguage =
    normalizeLanguage(
      language
    )


  return (

    <div
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

      data-placeholder={
        placeholder || undefined
      }

      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
      }}
    >

      <Editor

        height="100%"

        width="100%"

        language={
          monacoLanguage
        }

        value={
          value ?? ''
        }

        theme={
          API_TESTER_THEME
        }

        onMount={
          handleEditorMount
        }

        onChange={
          handleChange
        }

        options={{


            quickSuggestions:
    true,

  suggestOnTriggerCharacters:
    true,

  wordBasedSuggestions:
    'off',


          readOnly,

          wordWrap:
            singleLine
              ? 'off'
              : 'on',

          lineNumbers:
            'on',

          minimap: {
            enabled: false,
          },

          folding:
            true,

          automaticLayout:
            true,

          scrollBeyondLastLine:
            false,

          renderWhitespace:
            'selection',

          cursorBlinking:
            'blink',

          cursorStyle:
            'line',

          fontFamily:
            'Consolas, "Courier New", monospace',

          fontSize:
            14,

          lineHeight:
            21,

          padding: {
            top: 8,
            bottom: 8,
          },

          autoClosingBrackets:
            singleLine
              ? 'never'
              : 'always',

          autoClosingQuotes:
            singleLine
              ? 'never'
              : 'always',

          matchBrackets:
            'always',

          selectOnLineNumbers:
            true,

          roundedSelection:
            false,

          selectionHighlight:
            false,

          occurrencesHighlight:
            'off',

          hideCursorInOverviewRuler:
            true,

          overviewRulerBorder:
            false,

          scrollbar: {

            vertical:
              'auto',

            horizontal:
              'auto',

            verticalScrollbarSize:
              10,

            horizontalScrollbarSize:
              10,

          },




suggest: {

  preview: false,

  showReferences: true,

  showMethods: false,
  showFunctions: false,
  showConstructors: false,

  showClasses: false,
  showInterfaces: false,
  showStructs: false,

  showVariables: false,
  showFields: false,
  showProperties: false,

  showModules: false,
  showEnums: false,
  showEnumMembers: false,

  showKeywords: false,
  showWords: false,

  showSnippets: false,
  showUsers: false,
  showFiles: false,
  showFolders: false,

  showOperators: false,
  showConstants: false,
  showValues: false,
  showUnits: false,
  showTypeParameters: false,

  showColors: false,
  showEvents: false,
  showIssues: false,

},
        }}

      />

    </div>

  )
}