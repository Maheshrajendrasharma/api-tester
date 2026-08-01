import VariableField from './VariableField'

let nextHeaderId = 2

function HeadersEditor({ environment, headers, onChange }) {
  function updateHeader(id, field, value) {
    onChange(headers.map((header) => (
      header.id === id ? { ...header, [field]: value } : header
    )))
  }

  function addHeader() {
    onChange([...headers, { id: nextHeaderId++, enabled: true, key: '', value: '' }])
  }

  function deleteHeader(id) {
    onChange(headers.filter((header) => header.id !== id))
  }

  return (
    <div className="headers-editor">
      <table className="headers-table">
        <thead>
          <tr><th>Enabled</th><th>Key</th><th>Value</th><th aria-label="Delete header" /></tr>
        </thead>
        <tbody>
          {headers.map((header) => (
            <tr key={header.id}>
              <td><input aria-label={`Enable ${header.key || 'header'}`} checked={header.enabled} onChange={(event) => updateHeader(header.id, 'enabled', event.target.checked)} type="checkbox" /></td>
              <td><VariableField environment={environment} aria-label="Header key" value={header.key} onChange={(event) => updateHeader(header.id, 'key', event.target.value)} placeholder="Key" /></td>
              <td><VariableField environment={environment} aria-label="Header value" value={header.value} onChange={(event) => updateHeader(header.id, 'value', event.target.value)} placeholder="Value" /></td>
              <td><button className="delete-header-button" type="button" onClick={() => deleteHeader(header.id)} aria-label="Delete header" data-tooltip="Delete Header">×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-header-button" type="button" onClick={addHeader}>+ Add Header</button>
    </div>
  )
}

export default HeadersEditor
