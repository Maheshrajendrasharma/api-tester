import VariableField from './VariableField'

function ScriptEditor({
  environment,
  value,
  onChange,
  placeholder = 'Write script here...',
}) {
  return (
    <div className="script-editor">

      <VariableField
        environment={environment}
        value={value || ''}
        multiline
        placeholder={placeholder}
        onChange={onChange}
      />

    </div>
  )
}

export default ScriptEditor