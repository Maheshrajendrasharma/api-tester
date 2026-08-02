import { useEffect, useState } from 'react'

function SharedDialog({ open, type = 'input', title, message, initialValue = '', options = [], confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue)
  const [selectedOption, setSelectedOption] = useState(initialValue)

  useEffect(() => {
    if (open) {
      setValue(initialValue ?? '')
      setSelectedOption(initialValue ?? '')
    }
  }, [open, initialValue])

  if (!open) return null

  function handleSubmit() {
    if (type === 'choice') {
      onConfirm?.(selectedOption)
      return
    }

    if (type === 'confirm') {
      onConfirm?.(true)
      return
    }

    onConfirm?.(value)
  }

  function handleCancel() {
    if (type === 'confirm') {
      onCancel?.(false)
      return
    }

    onCancel?.(null)
  }

  return (
    <div className="shared-dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="shared-dialog-title">
      <div className="shared-dialog-card">
        {title && <h3 id="shared-dialog-title" className="shared-dialog-title">{title}</h3>}
        {message && <p className="shared-dialog-message">{message}</p>}

        {type === 'input' && (
          <input className="shared-dialog-input" value={value} onChange={(event) => setValue(event.target.value)} autoFocus />
        )}

        {type === 'choice' && (
          <div className="shared-dialog-choice-list">
            {options.map((option) => (
              <button key={option.value} type="button" className={`shared-dialog-choice ${selectedOption === option.value ? 'active' : ''}`} onClick={() => setSelectedOption(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="shared-dialog-actions">
          {(type === 'input' || type === 'choice') && (
            <button type="button" className="shared-dialog-secondary" onClick={handleCancel}>
              {cancelLabel}
            </button>
          )}
          <button type="button" className="shared-dialog-primary" onClick={handleSubmit}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SharedDialog
