import CodeEditor from './CodeEditor'

function ScriptEditor({
  environment,
  value,
  onChange,
  placeholder = 'Write JavaScript here...',
}) {
  return (
    <div className="script-editor">

      <CodeEditor
        value={value || ''}
        language="javascript"
        environment={environment}
        placeholder={placeholder}
        onChange={onChange}
      />

    </div>
  )
}

export default ScriptEditor