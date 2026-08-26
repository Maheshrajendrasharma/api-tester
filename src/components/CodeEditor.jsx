import Editor from "@monaco-editor/react";

import {
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

import {
  resolveDynamicVariable,
} from "../services/dynamicVariables";

import {
  getVariableReferences,
} from "../utils/variableIntelligence";

import {
  getAutocompleteVariables,
  filterAutocompleteVariables,
  getVariableAutocompleteContext,
} from "../utils/variableAutocomplete";


/*
 * =========================================================
 * MONACO THEME
 * =========================================================
 */

const API_TESTER_THEME = "api-tester-dark";


function defineApiTesterTheme(monaco) {

  monaco.editor.defineTheme(
    API_TESTER_THEME,
    {
      base: "vs-dark",

      inherit: true,

      rules: [

        /*
         * Comments
         */

        {
          token: "comment",
          foreground: "6A9955",
        },


        /*
         * JSON Keys
         */

        {
          token: "string.key.json",
          foreground: "6FC9FF",
        },


        /*
         * JSON String Values
         */

        {
          token: "string.value.json",
          foreground: "FFFFFF",
        },


        /*
         * Normal strings
         */

        {
          token: "string",
          foreground: "FFFFFF",
        },


        /*
         * Numbers
         */

        {
          token: "number",
          foreground: "4F81BD",
        },


        /*
         * Keywords
         */

        {
          token: "keyword",
          foreground: "C586C0",
        },


        /*
         * Types
         */

        {
          token: "type",
          foreground: "9CDCFE",
        },


        /*
         * Generic variables
         */

        {
          token: "variable",
          foreground: "DBE5EE",
        },

      ],

      colors: {

        "editor.background":
          "#151B21",

        "editor.foreground":
          "#DBE5EE",

        "editorCursor.foreground":
          "#6EE7B7",

        /*
         * Selection
         */

        "editor.selectionBackground":
          "#264F78",

        "editor.inactiveSelectionBackground":
          "#264F78",

        /*
         * Active line
         */

        "editor.lineHighlightBackground":
          "#1B222A",

        /*
         * Line numbers
         */

        "editorLineNumber.foreground":
          "#667384",

        "editorLineNumber.activeForeground":
          "#DBE5EE",

        /*
         * Gutter
         */

        "editorGutter.background":
          "#151B21",

        /*
         * Indentation
         */

        "editorIndentGuide.background":
          "#2C3640",

        "editorIndentGuide.activeBackground":
          "#465462",

        /*
         * Bracket matching
         */

        "editorBracketMatch.background":
          "#26384A",

        "editorBracketMatch.border":
          "#6EE7B7",

        /*
         * Hover
         */

        "editorHoverWidget.background":
          "#111820",

        "editorHoverWidget.border":
          "#394653",

        /*
         * Autocomplete
         */

        "editorSuggestWidget.background":
          "#111820",

        "editorSuggestWidget.border":
          "#394653",

        "editorSuggestWidget.foreground":
          "#DBE5EE",

        "editorSuggestWidget.selectedBackground":
          "#243B55",

        /*
         * Whitespace
         */

        "editorWhitespace.foreground":
          "#2C3640",

      },
    }
  );

}


/*
 * =========================================================
 * LANGUAGE NORMALIZATION
 * =========================================================
 */

function normalizeLanguage(language) {

  if (
    language === "js" ||
    language === "javascript"
  ) {

    return "javascript";

  }


  if (
    language === "json"
  ) {

    return "json";

  }


  return "plaintext";

}


/*
 * =========================================================
 * ENVIRONMENT VARIABLES
 * =========================================================
 */

function getEnvironmentVariables(environment) {

  const variables =
    Array.isArray(
      environment?.variables
    )
      ? environment.variables
      : [];


  return variables
    .filter(
      (item) =>
        String(
          item?.key ?? ""
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
          "Environment",

        value:
          item.value,

        enabled:
          item.enabled !== false,

      })
    );

}


/*
 * =========================================================
 * DYNAMIC VARIABLES
 * =========================================================
 */

function getDynamicVariables() {

  return [

    "guid",

    "randomUUID",

    "timestamp",

    "isoTimestamp",

    "randomFirstName",

    "randomLastName",

    "randomCountryCode",

  ];

}


/*
 * =========================================================
 * AVAILABLE VARIABLES
 * =========================================================
 */

function buildAvailableVariables(environment) {

  const environmentVariables =
    getEnvironmentVariables(
      environment
    );


  const dynamicVariables =
    getDynamicVariables().map(
      (key) => ({

        id:
          `dynamic-${key}`,

        key,

        source:
          "Dynamic",

        value:
          resolveDynamicVariable(key),

        enabled:
          true,

      })
    );


  return [

    ...environmentVariables,

    ...dynamicVariables,

  ];

}


/*
 * =========================================================
 * CODE EDITOR
 * =========================================================
 */

export default function CodeEditor({

  value = "",

  onChange,

  language = "text",

  environment,

  readOnly = false,

  placeholder = "",

  singleLine = false,

  className = "",

}) {


  /*
   * =======================================================
   * REFS
   * =======================================================
   */

  const editorRef =
    useRef(null);


  const monacoRef =
    useRef(null);


  const variableDecorationIdsRef =
    useRef([]);


  const completionProviderRef =
    useRef(null);


  const environmentRef =
    useRef(environment);


  const variablesRef =
    useRef([]);


  /*
   * Always keep the latest environment available.
   */

  environmentRef.current =
    environment;


  /*
   * =======================================================
   * AVAILABLE VARIABLES
   * =======================================================
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
    );


  variablesRef.current =
    availableVariables;


  /*
   * =======================================================
   * VARIABLE DECORATIONS
   *
   * Environment variable with value:
   * GREEN
   *
   * Missing / empty variable:
   * RED
   *
   * Disabled variable:
   * MUTED
   * =======================================================
   */

  const updateVariableDecorations =
    useCallback(
      () => {

        const editor =
          editorRef.current;


        if (!editor) {

          return;

        }


        const model =
          editor.getModel();


        if (!model) {

          return;

        }


        const references =
          getVariableReferences(
            model.getValue(),
            environmentRef.current
          );


        const decorations =
          references.map(
            (reference) => {

              const startPosition =
                model.getPositionAt(
                  reference.start
                );


              const endPosition =
                model.getPositionAt(
                  reference.end
                );


              let decorationClass =
                "api-variable-undefined";


              if (
                reference.status === "enabled"
              ) {

                decorationClass =
                  "api-variable-enabled";

              }


              else if (
                reference.status === "disabled"
              ) {

                decorationClass =
                  "api-variable-disabled";

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
                    decorationClass,

                },

              };

            }
          );


        variableDecorationIdsRef.current =
          editor.deltaDecorations(
            variableDecorationIdsRef.current,
            decorations
          );

      },
      []
    );


  /*
   * =======================================================
   * HANDLE VALUE CHANGE
   * =======================================================
   */

  const handleChange =
    useCallback(
      (nextValue) => {

        const finalValue =
          nextValue ?? "";


        onChange?.({

          target: {

            value:
              finalValue,

          },

        });


        requestAnimationFrame(
          () => {

            updateVariableDecorations();

          }
        );

      },
      [
        onChange,
        updateVariableDecorations,
      ]
    );


  /*
   * =======================================================
   * EDITOR MOUNT
   * =======================================================
   */

  const handleEditorMount =
    useCallback(
      (
        editor,
        monaco
      ) => {


        /*
         * Store references
         */

        editorRef.current =
          editor;


        monacoRef.current =
          monaco;


        /*
         * Define and activate theme
         */

        defineApiTesterTheme(
          monaco
        );


        monaco.editor.setTheme(
          API_TESTER_THEME
        );


        /*
         * ===================================================
         * AUTOCOMPLETE PROVIDER
         * ===================================================
         */

        completionProviderRef.current =
          monaco.languages.registerCompletionItemProvider(

            normalizeLanguage(
              language
            ),

            {

              /*
               * Monaco will call completion when {
               * is typed.
               */

              triggerCharacters: [
                "{",
              ],


              provideCompletionItems(
                model,
                position
              ) {


                const fullText =
                  model.getValue();


                const cursorOffset =
                  model.getOffsetAt(
                    position
                  );


                /*
                 * Check whether cursor is inside
                 *
                 * {{
                 * {{base
                 * {{$timestamp
                 */

                const context =
                  getVariableAutocompleteContext(
                    fullText,
                    cursorOffset
                  );


                /*
                 * Outside {{ }}
                 *
                 * Return nothing.
                 *
                 * This prevents JavaScript / Monaco
                 * irrelevant suggestions.
                 */

                if (!context) {

                  return {

                    suggestions: [],

                  };

                }


                /*
                 * Get only project variables.
                 */

                const variables =
                  getAutocompleteVariables(
                    environmentRef.current
                  );


                /*
                 * Filter based on text after {{
                 */

                const matches =
                  filterAutocompleteVariables(
                    variables,
                    context.query
                  );


                if (!matches.length) {

                  return {

                    suggestions: [],

                  };

                }


                /*
                 * Find replacement range.
                 *
                 * Example:
                 *
                 * {{bas|
                 *
                 * Only "bas" should be replaced.
                 */

                const queryStartOffset =
                  context.openIndex +
                  2 +
                  (
                    context.hasDollarPrefix
                      ? 1
                      : 0
                  );


                const startPosition =
                  model.getPositionAt(
                    queryStartOffset
                  );


                const range = {

                  startLineNumber:
                    startPosition.lineNumber,

                  startColumn:
                    startPosition.column,

                  endLineNumber:
                    position.lineNumber,

                  endColumn:
                    position.column,

                };


                return {

                  suggestions:

                    matches.map(
                      (variable) => {


                        const isDynamic =
                          variable.source ===
                          "Dynamic";


                        /*
                         * Dynamic variables should use $
                         *
                         * {{$timestamp}}
                         *
                         * Environment variables:
                         *
                         * {{base_url}}
                         */

                        const variableKey =
                          isDynamic
                            ? `$${variable.key}`
                            : variable.key;


                        return {

                          label:
                            variableKey,


                          kind:
                            monaco.languages
                              .CompletionItemKind
                              .Reference,


                          detail:
                            isDynamic
                              ? "Dynamic variable"
                              : "Environment variable",


                          documentation:
                            isDynamic
                              ? `Dynamic variable: ${variableKey}`
                              : `Environment variable: ${variable.key}`,


                          /*
                           * Insert the variable and
                           * automatically close }}
                           */

                          insertText:
  context.hasClosingBraces
    ? variableKey
    : `${variableKey}`,


                          range,


                          sortText:
                            isDynamic
                              ? `1-${variable.key}`
                              : `0-${variable.key}`,


                          filterText:
                            variable.key,

                        };

                      }
                    ),

                };

              },

            }

          );


        /*
         * ===================================================
         * EDITOR OPTIONS
         * ===================================================
         */

        editor.updateOptions({

          readOnly,


          wordWrap:
            singleLine
              ? "off"
              : "on",


          lineNumbers:
            "on",


          minimap: {

            enabled:
              false,

          },


          folding:
            true,


          automaticLayout:
            true,


          scrollBeyondLastLine:
            false,


          renderWhitespace:
            "selection",


          cursorBlinking:
            "blink",


          cursorStyle:
            "line",


          fontFamily:
            'Consolas, "Courier New", monospace',


          fontSize:
            14,


          lineHeight:
            21,


          padding: {

            top:
              8,

            bottom:
              8,

          },


          autoClosingBrackets:
            singleLine
              ? "never"
              : "always",


          autoClosingQuotes:
            singleLine
              ? "never"
              : "always",


          matchBrackets:
            "always",


          quickSuggestions:
            true,


          suggestOnTriggerCharacters:
            true,


          wordBasedSuggestions:
            "off",


          suggest: {

            preview:
              false,


            showReferences:
              true,


            showMethods:
              false,

            showFunctions:
              false,

            showConstructors:
              false,

            showClasses:
              false,

            showInterfaces:
              false,

            showStructs:
              false,

            showVariables:
              false,

            showFields:
              false,

            showProperties:
              false,

            showModules:
              false,

            showEnums:
              false,

            showEnumMembers:
              false,

            showKeywords:
              false,

            showWords:
              false,

            showSnippets:
              false,

            showUsers:
              false,

            showFiles:
              false,

            showFolders:
              false,

            showOperators:
              false,

            showConstants:
              false,

            showValues:
              false,

            showUnits:
              false,

            showTypeParameters:
              false,

            showColors:
              false,

            showEvents:
              false,

            showIssues:
              false,

          },


          selectOnLineNumbers:
            true,


          roundedSelection:
            false,


          selectionHighlight:
            false,


          occurrencesHighlight:
            "off",


          hideCursorInOverviewRuler:
            true,


          overviewRulerBorder:
            false,


          scrollbar: {

            vertical:
              "auto",

            horizontal:
              "auto",

            verticalScrollbarSize:
              10,

            horizontalScrollbarSize:
              10,

          },

        });


        /*
         * ===================================================
         * PLACEHOLDER
         * ===================================================
         */

        const wrapper =
          editor.getDomNode()
            ?.parentElement;


        if (
          wrapper &&
          placeholder
        ) {

          wrapper.setAttribute(
            "data-placeholder",
            placeholder
          );

        }


        /*
         * ===================================================
         * INITIAL VARIABLE COLORING
         * ===================================================
         */

        requestAnimationFrame(
          () => {

            updateVariableDecorations();

            editor.layout();

          }
        );


      },
      [
        language,
        readOnly,
        singleLine,
        placeholder,
        updateVariableDecorations,
      ]
    );


  /*
   * =========================================================
   * EXTERNAL VALUE SYNCHRONIZATION
   * =========================================================
   */

  useEffect(
    () => {

      const editor =
        editorRef.current;


      if (!editor) {

        return;

      }


      const model =
        editor.getModel();


      if (!model) {

        return;

      }


      const currentValue =
        editor.getValue();


      const nextValue =
        value ?? "";


      /*
       * Do nothing if Monaco already has
       * the correct value.
       */

      if (
        currentValue ===
        nextValue
      ) {

        requestAnimationFrame(
          () => {

            updateVariableDecorations();

          }
        );

        return;

      }


      const selection =
        editor.getSelection();


      editor.executeEdits(
        "external-value",
        [

          {

            range:
              model.getFullModelRange(),

            text:
              nextValue,

            forceMoveMarkers:
              true,

          },

        ]
      );


      /*
       * Restore cursor/selection where possible.
       */

      if (selection) {

        try {

          editor.setSelection(
            selection
          );

        }

        catch {

          /*
           * Ignore if selection is no longer valid.
           */

        }

      }


      requestAnimationFrame(
        () => {

          updateVariableDecorations();

        }
      );


    },
    [
      value,
      updateVariableDecorations,
    ]
  );


  /*
   * =========================================================
   * ENVIRONMENT CHANGES
   *
   * When environment variables change:
   *
   * - autocomplete updates
   * - green/red variable colors update
   * =========================================================
   */

  useEffect(
    () => {

      variablesRef.current =
        buildAvailableVariables(
          environment
        );


      requestAnimationFrame(
        () => {

          updateVariableDecorations();

        }
      );


    },
    [
      environment,
      updateVariableDecorations,
    ]
  );


  /*
   * =========================================================
   * CLEANUP
   * =========================================================
   */

  useEffect(
    () => {

      return () => {

        completionProviderRef.current
          ?.dispose();


        completionProviderRef.current =
          null;


        editorRef.current =
          null;


        monacoRef.current =
          null;


        variableDecorationIdsRef.current =
          [];

      };

    },
    []
  );


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  const monacoLanguage =
    normalizeLanguage(
      language
    );


  return (

    <div

      className={
        `code-editor${
          singleLine
            ? " code-editor-single-line"
            : ""
        }${
          className
            ? ` ${className}`
            : ""
        }`
      }


      data-placeholder={
        placeholder || undefined
      }


      style={{

        width:
          "100%",

        height:
          "100%",

        minHeight:
          0,

      }}

    >

      <Editor

        height="100%"

        width="100%"


        language={
          monacoLanguage
        }


        value={
          value ?? ""
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

          readOnly,


          quickSuggestions:
            true,


          suggestOnTriggerCharacters:
            true,


          wordBasedSuggestions:
            "off",


          wordWrap:
            singleLine
              ? "off"
              : "on",


          lineNumbers:
            "on",


          minimap: {

            enabled:
              false,

          },


          folding:
            true,


          automaticLayout:
            true,


          scrollBeyondLastLine:
            false,


          renderWhitespace:
            "selection",


          cursorBlinking:
            "blink",


          cursorStyle:
            "line",


          fontFamily:
            'Consolas, "Courier New", monospace',


          fontSize:
            14,


          lineHeight:
            21,


          padding: {

            top:
              8,

            bottom:
              8,

          },


          autoClosingBrackets:
            singleLine
              ? "never"
              : "always",


          autoClosingQuotes:
            singleLine
              ? "never"
              : "always",


          matchBrackets:
            "always",


          selectOnLineNumbers:
            true,


          roundedSelection:
            false,


          selectionHighlight:
            false,


          occurrencesHighlight:
            "off",


          hideCursorInOverviewRuler:
            true,


          overviewRulerBorder:
            false,


          scrollbar: {

            vertical:
              "auto",

            horizontal:
              "auto",

            verticalScrollbarSize:
              10,

            horizontalScrollbarSize:
              10,

          },


          suggest: {

            preview:
              false,

            showReferences:
              true,

            showMethods:
              false,

            showFunctions:
              false,

            showConstructors:
              false,

            showClasses:
              false,

            showInterfaces:
              false,

            showStructs:
              false,

            showVariables:
              false,

            showFields:
              false,

            showProperties:
              false,

            showModules:
              false,

            showEnums:
              false,

            showEnumMembers:
              false,

            showKeywords:
              false,

            showWords:
              false,

            showSnippets:
              false,

            showUsers:
              false,

            showFiles:
              false,

            showFolders:
              false,

            showOperators:
              false,

            showConstants:
              false,

            showValues:
              false,

            showUnits:
              false,

            showTypeParameters:
              false,

            showColors:
              false,

            showEvents:
              false,

            showIssues:
              false,

          },

        }}

      />

    </div>

  );

}