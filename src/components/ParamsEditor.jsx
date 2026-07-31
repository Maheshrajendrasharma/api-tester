let nextParameterId = 2

function ParamsEditor({ parameters, onChange }) {
  function updateParameter(id, field, value) {
    onChange(parameters.map((parameter) => (
      parameter.id === id ? { ...parameter, [field]: value } : parameter
    )))
  }

  function addParameter() {
    onChange([...parameters, { id: nextParameterId++, enabled: true, key: '', value: '' }])
  }

  function deleteParameter(id) {
    onChange(parameters.filter((parameter) => parameter.id !== id))
  }

  return (
    <div className="params-editor">
      <table className="params-table">
        <thead>
          <tr><th>Enabled</th><th>Key</th><th>Value</th><th aria-label="Delete parameter" /></tr>
        </thead>
        <tbody>
          {parameters.map((parameter) => (
            <tr key={parameter.id}>
              <td><input aria-label={`Enable ${parameter.key || 'parameter'}`} checked={parameter.enabled} onChange={(event) => updateParameter(parameter.id, 'enabled', event.target.checked)} type="checkbox" /></td>
              <td><input aria-label="Parameter key" value={parameter.key} onChange={(event) => updateParameter(parameter.id, 'key', event.target.value)} placeholder="Key" /></td>
              <td><input aria-label="Parameter value" value={parameter.value} onChange={(event) => updateParameter(parameter.id, 'value', event.target.value)} placeholder="Value" /></td>
              <td><button className="delete-parameter-button" type="button" onClick={() => deleteParameter(parameter.id)} aria-label="Delete parameter">×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-parameter-button" type="button" onClick={addParameter}>+ Add Parameter</button>
    </div>
  )
}

export default ParamsEditor
