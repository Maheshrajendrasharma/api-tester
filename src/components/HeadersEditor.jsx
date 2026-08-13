import { useEffect } from 'react'
import VariableField from './VariableField'

let nextHeaderId = 2

function createBlankHeader() {
  return {
    id: nextHeaderId++,
    enabled: true,
    key: '',
    value: '',
  }
}

function HeadersEditor({
  environment,
  headers = [],
  onChange
}) {

  /*
   * Always make sure there is one blank row
   * at the bottom.
   */
  useEffect(() => {

    if (headers.length === 0) {
      onChange([createBlankHeader()])
      return
    }

    const lastHeader = headers[headers.length - 1]

    const lastIsBlank =
      !lastHeader.key.trim() &&
      !lastHeader.value.trim()

    if (!lastIsBlank) {
      onChange([
        ...headers,
        createBlankHeader()
      ])
    }

  }, [headers, onChange])


  function updateHeader(id, field, value) {

    const updatedHeaders = headers.map((header) =>
      header.id === id
        ? {
            ...header,
            [field]: value
          }
        : header
    )

    const lastHeader =
      updatedHeaders[updatedHeaders.length - 1]

    const lastIsBlank =
      lastHeader &&
      !lastHeader.key.trim() &&
      !lastHeader.value.trim()

    if (!lastIsBlank) {
      updatedHeaders.push(createBlankHeader())
    }

    onChange(updatedHeaders)
  }


  function deleteHeader(id) {

    let updatedHeaders =
      headers.filter(
        (header) => header.id !== id
      )

    if (updatedHeaders.length === 0) {
      updatedHeaders = [createBlankHeader()]
    }

    const lastHeader =
      updatedHeaders[updatedHeaders.length - 1]

    const lastIsBlank =
      !lastHeader.key.trim() &&
      !lastHeader.value.trim()

    if (!lastIsBlank) {
      updatedHeaders.push(createBlankHeader())
    }

    onChange(updatedHeaders)
  }


  return (
    <div className="headers-editor">

      {/* =====================================================
          HEADERS TABLE
          ===================================================== */}

      <div className="headers-table">

        {/* ===================================================
            TABLE HEADER
            =================================================== */}

        <div className="headers-table-header">

          <div className="headers-column-enabled">
            <span>Enabled</span>
          </div>

          <div className="headers-column-key">
            <span>Key</span>
          </div>

          <div className="headers-column-value">
            <span>Value</span>
          </div>

          <div className="headers-column-actions">
            <span></span>
          </div>

        </div>


        {/* ===================================================
            TABLE BODY
            =================================================== */}

        <div className="headers-table-body">

          {headers.map((header) => (

            <div
              className="headers-data-row"
              key={header.id}
            >

              {/* =============================================
                  ENABLED
                  ============================================= */}

              <div className="headers-cell-enabled">

                <input
                  className="headers-enable-checkbox"
                  aria-label={`Enable ${header.key || 'header'}`}
                  checked={header.enabled}
                  onChange={(event) =>
                    updateHeader(
                      header.id,
                      'enabled',
                      event.target.checked
                    )
                  }
                  type="checkbox"
                />

              </div>


              {/* =============================================
                  KEY
                  ============================================= */}

              <div className="headers-cell-key">

                <input
                  className="headers-key-input"
                  aria-label="Header key"
                  value={header.key}
                  onChange={(event) =>
                    updateHeader(
                      header.id,
                      'key',
                      event.target.value
                    )
                  }
                  placeholder="Key"
                  type="text"
                />

              </div>


              {/* =============================================
                  VALUE
                  ============================================= */}

              <div className="headers-cell-value">

                <VariableField
                  className="headers-value-field"
                  environment={environment}
                  aria-label="Header value"
                  value={header.value}
                  onChange={(event) =>
                    updateHeader(
                      header.id,
                      'value',
                      event.target.value
                    )
                  }
                  placeholder="Value"
                />

              </div>


              {/* =============================================
                  DELETE
                  ============================================= */}

              <div className="headers-cell-actions">

                <button
                  className="headers-delete-button"
                  type="button"
                  onClick={() =>
                    deleteHeader(header.id)
                  }
                  aria-label="Delete header"
                  data-tooltip="Delete Header"
                >
                  ×
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}

export default HeadersEditor