function ScriptEditor({
    value,
    onChange,
    placeholder,
}) {
    return (
        <textarea
            className="script-editor"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            spellCheck={false}
        />
    )
}

export default ScriptEditor