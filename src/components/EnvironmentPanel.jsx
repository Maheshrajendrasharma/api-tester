import { createVariableDraft } from '../services/environmentService'

function EnvironmentPanel({ environments, onEnvironmentChange, onEnvironmentsChange, onImportEnvironment, onExportEnvironment }) {
  const activeEnvironment = environments.find((environment) => environment.active) ?? environments[0]

  function updateVariable(variableId, field, value) {
    onEnvironmentsChange(environments.map((environment) => (
      environment.id === activeEnvironment?.id
        ? {
            ...environment,
            variables: environment.variables.map((variable) => (
              variable.id === variableId ? { ...variable, [field]: value } : variable
            )),
          }
        : environment
    )))
  }


  
  function addVariable() {
    if (!activeEnvironment) return

    const variable = createVariableDraft()
    onEnvironmentsChange(environments.map((environment) => (
      environment.id === activeEnvironment.id
        ? { ...environment, variables: [...environment.variables, variable] }
        : environment
    )))
  }

function deleteCheckedVariables() {

    if (!activeEnvironment) return

    onEnvironmentsChange(

        environments.map(environment =>

            environment.id===activeEnvironment.id

            ? {

                ...environment,

                variables:environment.variables.filter(

                    variable=>!variable.enabled

                )

            }

            : environment

        )

    )

}


  return (
    <aside className="environment-panel" aria-label="Environment variables">
      <div className="environment-panel-header">
        <div className="environment-tabs" role="tablist" aria-label="Environments">
          {environments.map((environment) => (
  <div
    key={environment.id}
    className="environment-tab-wrapper"
  >
    <button
      className={`environment-tab${environment.active ? ' active' : ''}`}
      type="button"
      onClick={() => onEnvironmentChange(environment.id)}
    >
      {environment.name}
    </button>

    
  </div>
))}
        </div>
      </div>
      <div className="environment-panel-body">
        <h2>Variables</h2>
        <table className="environment-variables-table">
          <thead><tr><th></th><th>Key</th><th>Value</th></tr></thead>
          <tbody>
            {activeEnvironment?.variables.map((variable) => (
              <tr key={variable.id}>
                <td><input aria-label={`Enable ${variable.key || 'variable'}`} checked={variable.enabled !== false} type="checkbox" onChange={(event) => updateVariable(variable.id, 'enabled', event.target.checked)} /></td>
                <td><input aria-label="Variable key" value={variable.key} onChange={(event) => updateVariable(variable.id, 'key', event.target.value)} placeholder="Key" /></td>
                <td><input aria-label="Variable value" value={variable.value} onChange={(event) => updateVariable(variable.id, 'value', event.target.value)} placeholder="Value" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="environment-actions">

    <button
        className="add-variable-button"
        type="button"
        onClick={addVariable}
    >
        + Add Variable
    </button>

    <button
        className="delete-variable-button"
        type="button"
        onClick={deleteCheckedVariables}
    >
        Delete Checked
    </button>

    <button
        className="import-environment-button"
        type="button"
        onClick={onImportEnvironment}
    >
        Import
    </button>

    <button
        className="export-environment-button"
        type="button"
        onClick={onExportEnvironment}
    >
        Export
    </button>

</div>
      </div>
    </aside>
  )
}

export default EnvironmentPanel
