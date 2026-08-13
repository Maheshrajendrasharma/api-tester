import VariableField from './VariableField'

let nextParamId = 1

function createEmptyParameter() {
  return {
    id: nextParamId++,
    enabled: true,
    key: '',
    value: '',
    description: '',
  }
}

function ParamsEditor({
  environment,
  parameters = [],
  onChange,
}) {

  // =====================================================
  // ALWAYS SHOW AT LEAST ONE EDITABLE ROW
  // =====================================================

  const rows =
    parameters.length > 0
      ? parameters
      : [createEmptyParameter()]


  // =====================================================
  // UPDATE PARAMETER
  // =====================================================

  function updateParameter(id, field, value) {

    const updatedParameters = rows.map((parameter) =>
      parameter.id === id
        ? {
            ...parameter,
            [field]: value,
          }
        : parameter
    )

    const lastParameter =
      updatedParameters[updatedParameters.length - 1]

    const lastIsFilled =
      lastParameter &&
      (
        lastParameter.key.trim() !== '' ||
        lastParameter.value.trim() !== '' ||
        lastParameter.description.trim() !== ''
      )

    // Automatically add a new blank row
    if (lastIsFilled) {
      updatedParameters.push(
        createEmptyParameter()
      )
    }

    onChange(updatedParameters)
  }


  // =====================================================
  // DELETE PARAMETER
  // =====================================================

  function deleteParameter(id) {

    let updatedParameters =
      rows.filter(
        (parameter) =>
          parameter.id !== id
      )

    // Always keep one blank row
    if (updatedParameters.length === 0) {
      updatedParameters = [
        createEmptyParameter()
      ]
    }

    onChange(updatedParameters)
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="params-editor">

      {/* =================================================
          PARAMS TABLE
          ================================================= */}

      <div className="params-table">


        {/* =================================================
            TABLE HEADER
            ================================================= */}

        <div className="params-table-header">

          <div className="params-column-enabled">
            <span>Enabled</span>
          </div>

          <div className="params-column-key">
            <span>Key</span>
          </div>

          <div className="params-column-value">
            <span>Value</span>
          </div>

          <div className="params-column-description">
            <span>Description</span>
          </div>

          <div className="params-column-actions">
            <span></span>
          </div>

        </div>


        {/* =================================================
            TABLE BODY
            ================================================= */}

        <div className="params-table-body">

          {rows.map((parameter) => (

            <div
              className="params-data-row"
              key={parameter.id}
            >


              {/* =========================================
                  ENABLED
                  ========================================= */}

              <div className="params-cell-enabled">

                <input
                  className="params-enable-checkbox"
                  type="checkbox"
                  checked={parameter.enabled}
                  aria-label={`Enable ${
                    parameter.key || 'parameter'
                  }`}
                  onChange={(event) =>
                    updateParameter(
                      parameter.id,
                      'enabled',
                      event.target.checked
                    )
                  }
                />

              </div>


              {/* =========================================
                  KEY
                  ========================================= */}

              <div className="params-cell-key">

                <input
                  className="params-key-input"
                  type="text"
                  value={parameter.key}
                  placeholder="Key"
                  aria-label="Parameter key"
                  onChange={(event) =>
                    updateParameter(
                      parameter.id,
                      'key',
                      event.target.value
                    )
                  }
                />

              </div>


              {/* =========================================
                  VALUE
                  ========================================= */}

              <div className="params-cell-value">

                <VariableField
                  className="params-value-field"
                  environment={environment}
                  value={parameter.value}
                  placeholder="Value"
                  aria-label="Parameter value"
                  onChange={(event) =>
                    updateParameter(
                      parameter.id,
                      'value',
                      event.target.value
                    )
                  }
                />

              </div>


              {/* =========================================
                  DESCRIPTION
                  ========================================= */}

              <div className="params-cell-description">

                <input
                  className="params-description-input"
                  type="text"
                  value={parameter.description}
                  placeholder="Description"
                  aria-label="Parameter description"
                  onChange={(event) =>
                    updateParameter(
                      parameter.id,
                      'description',
                      event.target.value
                    )
                  }
                />

              </div>


              {/* =========================================
                  DELETE
                  ========================================= */}

              <div className="params-cell-actions">

                <button
                  type="button"
                  className="params-delete-button"
                  onClick={() =>
                    deleteParameter(
                      parameter.id
                    )
                  }
                  aria-label="Delete parameter"
                  data-tooltip="Delete Parameter"
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

export default ParamsEditor