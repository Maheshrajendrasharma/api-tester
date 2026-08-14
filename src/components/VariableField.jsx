import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { createPortal } from 'react-dom'

import {
  getAutocompleteQuery,
  getVariableReferences
} from '../utils/variableIntelligence'

import { resolveDynamicVariable } from '../services/dynamicVariables'


function VariableField({
  environment,
  value = '',
  onChange,
  className = '',
  multiline = false,
  ...inputProps
}) {


  const inputRef = useRef(null)

  const containerRef = useRef(null)


  const [autocomplete, setAutocomplete] =
    useState(null)


  const [activeSuggestion, setActiveSuggestion] =
    useState(0)


  const [scrollPosition, setScrollPosition] =
    useState({
      left: 0,
      top: 0
    })


  const [dropdownPosition, setDropdownPosition] =
    useState({
      top: 0,
      left: 0,
      width: 260
    })


  // =====================================================
  // ENVIRONMENT VARIABLES
  // =====================================================


  const environmentVariables = useMemo(() => {


    return (environment?.variables ?? [])

      .filter(
        (item) =>
          item?.enabled !== false &&
          String(item?.key ?? '').trim()
      )

      .map((item) => ({
        id: `env-${item.id ?? item.key}`,
        key: String(item.key).trim(),
        source: 'Environment',
        value: item.value
      }))


  }, [environment])



  // =====================================================
  // DYNAMIC VARIABLES
  // =====================================================


  const dynamicVariables = useMemo(() => {


    const keys = [
      'guid',
      'timestamp',
      'isoTimestamp',
      'randomFirstName',
      'randomLastName'
    ]


    return keys.map((key) => ({

      id: `dynamic-${key}`,

      key,

      source: 'Dynamic',

      value: resolveDynamicVariable(key)

    }))


  }, [])



  // =====================================================
  // AVAILABLE VARIABLES
  // =====================================================


  const availableVariables = useMemo(() => {


    return [

      ...environmentVariables,

      ...dynamicVariables

    ]


  }, [
    environmentVariables,
    dynamicVariables
  ])



  // =====================================================
  // VARIABLE REFERENCES
  // =====================================================


  const references = useMemo(

    () =>

      getVariableReferences(
        value,
        environment
      ),

    [
      value,
      environment
    ]

  )



  // =====================================================
  // AUTOCOMPLETE
  // =====================================================


  const suggestions = useMemo(() => {


    if (!autocomplete) {

      return []

    }


    const query =
      autocomplete.query
        .toLowerCase()



    return availableVariables.filter(

      (variable) =>

        variable.key
          .toLowerCase()
          .startsWith(query)

    )


  }, [

    autocomplete,

    availableVariables

  ])



  const hasVariables =
    references.length > 0




  // =====================================================
  // CLOSE DROPDOWN OUTSIDE CLICK
  // =====================================================


  useEffect(() => {


    function handleOutsideClick(event) {


      if (

        containerRef.current &&

        !containerRef.current.contains(
          event.target
        )

      ) {

        setAutocomplete(null)

      }


    }



    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )



    return () => {


      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )


    }


  }, [])



  // =====================================================
  // UPDATE DROPDOWN POSITION
  // =====================================================


  function updateDropdownPosition() {


    const input =
      inputRef.current



    if (!input) {

      return

    }



    const rect =
      input.getBoundingClientRect()



    setDropdownPosition({

      top: rect.bottom + 5,

      left: rect.left,

      width: rect.width

    })


  }




  // =====================================================
  // AUTOCOMPLETE UPDATE
  // =====================================================


  function updateAutocomplete(
    nextValue,
    cursorPosition
  ) {


    const nextAutocomplete =

      getAutocompleteQuery(

        nextValue,

        cursorPosition

      )



    setAutocomplete(
      nextAutocomplete
    )



    requestAnimationFrame(() => {

      updateDropdownPosition()

    })



    setActiveSuggestion(0)


  }



  // =====================================================
  // CHANGE
  // =====================================================


  function handleChange(event) {


    onChange(event)


    updateAutocomplete(

      event.target.value,

      event.target.selectionStart

    )


  }



  // =====================================================
  // APPLY VARIABLE
  // =====================================================


  function applySuggestion(variable) {


    if (!autocomplete) {

      return

    }


    const key =

      String(
        variable.key ?? ''
      ).trim()



    if (!key) {

      return

    }



    const replacement =

      `{{${key}}}`



    const nextValue =


      value.slice(

        0,

        autocomplete.start

      )

      +

      replacement

      +

      value.slice(

        autocomplete.end

      )



    onChange({

      target: {

        value: nextValue

      }

    })



    setAutocomplete(null)



    requestAnimationFrame(() => {


      if (!inputRef.current) {

        return

      }


      inputRef.current.focus()


    })


  }

  // =====================================================
// KEYBOARD NAVIGATION
// =====================================================

function handleKeyDown(event) {


  if (!suggestions.length) {

    return

  }



  if (
    event.key === 'ArrowDown' ||
    event.key === 'ArrowUp'
  ) {


    event.preventDefault()



    setActiveSuggestion((current) =>

      (
        current +

        (
          event.key === 'ArrowDown'
            ? 1
            : -1
        )

        +

        suggestions.length

      )

      %

      suggestions.length

    )


    return

  }



  if (event.key === 'Enter') {


    event.preventDefault()



    applySuggestion(

      suggestions[activeSuggestion]

    )


    return

  }



  if (event.key === 'Escape') {


    setAutocomplete(null)


  }


}




// =====================================================
// VARIABLE OVERLAY
// =====================================================

function renderOverlay() {


  if (
    !references.length ||
    typeof value !== 'string'
  ) {

    return null

  }



  let cursor = 0


  const nodes = []



  references.forEach(

    (reference, index) => {



      if (
        reference.start > cursor
      ) {


        nodes.push(

          <span

            key={`text-${cursor}-${index}`}

            className="variable-field-text"

          >

            {
              value.slice(
                cursor,
                reference.start
              )
            }

          </span>

        )

      }



      const tooltip =

        reference.status === 'enabled'

          ? `Variable: ${reference.key}\nValue: ${reference.value ?? ''}`

          :

          reference.status === 'disabled'

            ? 'Variable disabled'

            :

            'Undefined variable'



      nodes.push(

        <span

          key={`${reference.start}-${index}`}

          className={
            `variable-token ${reference.status}`
          }

          title={tooltip}

        >

          {
            value.slice(
              reference.start,
              reference.end
            )
          }

        </span>

      )



      cursor = reference.end


    }

  )



  if (cursor < value.length) {


    nodes.push(

      <span

        key={`text-${cursor}`}

        className="variable-field-text"

      >

        {
          value.slice(cursor)
        }

      </span>

    )


  }



  return nodes


}




// =====================================================
// INPUT TYPE
// =====================================================

const Input =

  multiline

    ? 'textarea'

    : 'input'





// =====================================================
// TOOLTIP
// =====================================================

const tooltip =

  references

    .map(

      (reference) =>

        reference.status === 'enabled'

          ? `Variable: ${reference.key} • Value: ${reference.value ?? ''}`

          :

          reference.status === 'disabled'

            ? `${reference.key}: Variable disabled`

            :

            `${reference.key}: Undefined variable`

    )

    .join('\n')





// =====================================================
// RENDER
// =====================================================

return (

  <div

    ref={containerRef}

    className={
      `variable-field${multiline ? ' multiline' : ''}`
    }

    title={tooltip}

  >



    {
      hasVariables && (

        <div

          className="variable-field-overlay"

          aria-hidden="true"

          style={{

            transform:

              `translate(${-scrollPosition.left}px, ${-scrollPosition.top}px)`

          }}

        >

          {
            renderOverlay()
          }

        </div>

      )

    }





    <Input

      {...inputProps}

      ref={inputRef}

      className={
        `variable-field-input${hasVariables ? ' has-variables' : ''}${className ? ` ${className}` : ''}`
      }

      value={value}

      onChange={handleChange}

      onKeyDown={handleKeyDown}


      onClick={(event) =>

        updateAutocomplete(

          event.currentTarget.value,

          event.currentTarget.selectionStart

        )

      }


      onScroll={(event) =>

        setScrollPosition({

          left:
            event.currentTarget.scrollLeft,

          top:
            event.currentTarget.scrollTop

        })

      }

    />





    {suggestions.length > 0 &&
createPortal(
    <div
        className="variable-autocomplete floating-dropdown"
        style={{
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 999999
        }}
    >

        {suggestions.map((variable,index)=>(
            <button
                key={variable.id}
                type="button"
                onMouseDown={(event) => {

    event.preventDefault()

    applySuggestion(variable)

}}
            >
                {variable.key}
            </button>
        ))}

    </div>,

    document.body
)}



  </div>

)


}


export default VariableField