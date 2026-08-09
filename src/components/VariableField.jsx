import { useMemo, useRef, useState } from 'react'
import { getAutocompleteQuery, getVariableReferences } from '../utils/variableIntelligence'

function VariableField({ environment, value, onChange, className = '', multiline = false, ...inputProps }) {
  const inputRef = useRef(null)
  const [autocomplete, setAutocomplete] = useState(null)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 })
  const references = useMemo(() => getVariableReferences(value, environment), [value, environment])
  const availableVariables = useMemo(() => (environment?.variables ?? []).filter((item) => item.enabled !== false && String(item.key ?? '').trim()), [environment])
  const suggestions = autocomplete ? availableVariables.filter((item) => item.key.trim().toLowerCase().startsWith(autocomplete.query.toLowerCase())) : []
  const hasVariables = references.length > 0

  function updateAutocomplete(nextValue, cursorPosition) {
    const nextAutocomplete = getAutocompleteQuery(nextValue, cursorPosition)
    setAutocomplete(nextAutocomplete)
    setActiveSuggestion(0)
  }

  function handleChange(event) {
    onChange(event)
    updateAutocomplete(event.target.value, event.target.selectionStart)
  }

function applySuggestion(variable) {
  if (!autocomplete) return;
  // Trim and build replacement string
  const key = String(variable.key ?? '').trim();
  if (!key) return;
  const replacement = `{{${key}}}`;
  // Replace full variable range
  const nextValue =
    value.slice(0, autocomplete.start) +
    replacement +
    value.slice(autocomplete.end);
  onChange({ target: { value: nextValue } });
  // Move cursor to end of inserted token
  const cursorPosition = autocomplete.start + replacement.length;
  setAutocomplete(null);
  requestAnimationFrame(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(cursorPosition, cursorPosition);
  });
}


  function handleKeyDown(event) {
    if (!suggestions.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestion((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length)
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      applySuggestion(suggestions[activeSuggestion])
    }
    if (event.key === 'Escape') setAutocomplete(null)
  }

  function renderOverlay() {
    if (!references.length || typeof value !== 'string') return null

    let cursor = 0
    const nodes = []
    references.forEach((reference, index) => {
      if (reference.start > cursor) {
        nodes.push(<span key={`text-${cursor}-${index}`} className="variable-field-text">{value.slice(cursor, reference.start)}</span>)
      }

      const tooltip = reference.status === 'enabled'
        ? `Variable: ${reference.key}\nValue: ${reference.value ?? ''}`
        : reference.status === 'disabled'
          ? 'Variable disabled'
          : 'Undefined variable'

      nodes.push(<span className={`variable-token ${reference.status}`} title={tooltip} key={`${reference.start}-${index}`}>{value.slice(reference.start, reference.end)}</span>)
      cursor = reference.end
    })

    if (cursor < value.length) {
      nodes.push(<span key={`text-${cursor}`} className="variable-field-text">{value.slice(cursor)}</span>)
    }

    return nodes
  }

  const Input = multiline ? 'textarea' : 'input'
  const tooltip = references.map((reference) => (reference.status === 'enabled' ? `Variable: ${reference.key} • Value: ${reference.value ?? ''}` : reference.status === 'disabled' ? `${reference.key}: Variable disabled` : `${reference.key}: Undefined variable`)).join('\n')

  return (
    <div className={`variable-field${multiline ? ' multiline' : ''}`} title={tooltip}>
      {hasVariables && (
        <div className="variable-field-overlay" aria-hidden="true" style={{ transform: `translate(${-scrollPosition.left}px, ${-scrollPosition.top}px)` }}>
          {renderOverlay()}
        </div>
      )}
      <Input {...inputProps} ref={inputRef}
        className={`variable-field-input${hasVariables ? ' has-variables' : ''}${className ? ` ${className}` : ''}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(event) => updateAutocomplete(event.currentTarget.value, event.currentTarget.selectionStart)}
        onScroll={(event) => setScrollPosition({ left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop })}
      />
      {suggestions.length > 0 && (
        <div className="variable-autocomplete" role="listbox" aria-label="Variable suggestions">
          {suggestions.map((variable, index) => <button className={index === activeSuggestion ? 'active' : ''} key={variable.id} type="button" role="option" aria-selected={index === activeSuggestion} onMouseDown={(event) => event.preventDefault()} onClick={() => applySuggestion(variable)}>{String(variable.key).trim()}</button>)}
        </div>
      )}
    </div>
  )
}

export default VariableField
