import { useEffect, useState } from 'react'

function SharedDialog({
    open,
    type = 'input',
    title,
    message,
    initialValue = '',
    options = [],
    items = [],
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel
}) {

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
  <div
    className="shared-dialog-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="shared-dialog-title"
  >
    <div
      className={`shared-dialog-card ${
        type === 'close-confirm'
          ? 'shared-dialog-close-confirm'
          : ''
      }`}
    >

      {/* =========================================
          CLOSE CONFIRM HEADER
          ========================================= */}

      {type === 'close-confirm' && (
        <div className="shared-dialog-close-header">

          <h3
            id="shared-dialog-title"
            className="shared-dialog-title"
          >
            {title}
          </h3>

          <button
            type="button"
            className="shared-dialog-close-x"
            onClick={() => onCancel?.(false)}
            aria-label="Close"
          >
            ×
          </button>

        </div>
      )}


      {/* NORMAL DIALOG TITLE */}

      {type !== 'close-confirm' && title && (
        <h3
          id="shared-dialog-title"
          className="shared-dialog-title"
        >
          {title}
        </h3>
      )}


      {/* MESSAGE */}

      {type === 'close-confirm' ? (

        <div className="shared-dialog-close-content">

          <div className="shared-dialog-warning">

            <span className="shared-dialog-warning-icon">
              ⚠
            </span>

            <div>

              <h4>
                Hold on...
              </h4>

              {message && (
                <p className="shared-dialog-message">
                  {message}
                </p>
              )}

            </div>

          </div>

          {items.length > 0 && (
    <div className="shared-dialog-change-list">

        {items.map((item, index) => (

            <div
                key={item.id ?? index}
                className="shared-dialog-change-item"
            >
                Request: {item.name}
            </div>

        ))}

    </div>
)}

        </div>



      ) : (

        message && (
          <p className="shared-dialog-message">
            {message}
          </p>
        )

      )}


      {/* INPUT */}

      {type === 'input' && (
        <input
          className="shared-dialog-input"
          value={value}
          onChange={(event) =>
            setValue(event.target.value)
          }
          autoFocus
        />
      )}


      {/* CHOICE */}

      {type === 'choice' && (
        <div className="shared-dialog-choice-list">

          {options.map((option) => (

            <button
              key={option.value}
              type="button"
              className={`shared-dialog-choice ${
                selectedOption === option.value
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setSelectedOption(option.value)
              }
            >
              {option.label}
            </button>

          ))}

        </div>
      )}


      {/* =========================================
          CLOSE CONFIRM BUTTONS
          ========================================= */}

      {type === 'close-confirm' && (

        <div className="shared-dialog-close-actions">

          <button
            type="button"
            className="shared-dialog-dont-save"
            onClick={() => onCancel?.('dont-save')}
          >
            Don't Save
          </button>


          <div className="shared-dialog-close-right">

            <button
              type="button"
              className="shared-dialog-cancel"
              onClick={() => onCancel?.('cancel')}
            >
              Cancel
            </button>


            <button
              type="button"
              className="shared-dialog-primary"
              onClick={() => onConfirm?.(true)}
            >
              {confirmLabel || 'Save All'}
            </button>

          </div>

        </div>

      )}


      {/* =========================================
          EXISTING NORMAL BUTTONS
          ========================================= */}

      {type !== 'close-confirm' && (

        <div className="shared-dialog-actions">

{cancelLabel && (
  <button
    type="button"
    className="shared-dialog-secondary"
    onClick={handleCancel}
  >
    {cancelLabel}
  </button>
)}

          <button
            type="button"
            className="shared-dialog-primary"
            onClick={handleSubmit}
          >
            {confirmLabel}
          </button>

        </div>

      )}

    </div>
  </div>
)
}

export default SharedDialog
