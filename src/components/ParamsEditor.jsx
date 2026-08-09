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
  // Always show at least one editable row
  const rows =
    parameters.length > 0
      ? parameters
      : [createEmptyParameter()]

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
      updatedParameters.push(createEmptyParameter())
    }

    onChange(updatedParameters)
  }

  function deleteParameter(id) {
    let updatedParameters = rows.filter(
      (parameter) => parameter.id !== id
    )

    // Always keep one blank row
    if (updatedParameters.length === 0) {
      updatedParameters = [createEmptyParameter()]
    }

    onChange(updatedParameters)
  }

  return (
    <div className="params-editor">

      {/* Top section */}
      <div className="params-toolbar">
        <h3>Params</h3>

        <button
          type="button"
          className="auto-generated-toggle"
        >
          ◉ Hide auto-generated parameters
        </button>
      </div>

      {/* Table */}
      <div className="params-table">

        {/* Header */}
        <div className="params-table-header">
          <span></span>
          <span>Key</span>
          <span>Value</span>
          <span>Description</span>
          <span>•••</span>
        </div>

        {/* Rows */}
        <div className="params-table-body">

          {rows.map((parameter) => (

            <div
              className="param-row"
              key={parameter.id}
            >

              {/* Enabled */}
              <div className="param-enabled">

                <input
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

              {/* Key */}
              <div className="param-field">

                <input
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

              {/* Value */}
              <div className="param-field">

                <VariableField
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

              {/* Description */}
              <div className="param-field">

                <input
                  type="text"
                  value={parameter.description}
                  placeholder=""
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

              {/* Delete */}
              <div className="param-delete">

                <button
                  type="button"
                  className="delete-param-button"
                  onClick={() =>
                    deleteParameter(parameter.id)
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

