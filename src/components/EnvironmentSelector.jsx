function EnvironmentSelector({ environments, onChange }) {
  const activeEnvironment = environments.find((environment) => environment.active) ?? environments[0]

  return (
    <label className="environment-selector">
      <span className="environment-globe" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.35 3.6 5.18 3.6 8.5S14.4 18.15 12 20.5M12 3.5C9.6 5.85 8.4 8.68 8.4 12s1.2 6.15 3.6 8.5" /></svg>
      </span>
      <span className="visually-hidden">Active environment</span>
      <select value={activeEnvironment?.id ?? ''} onChange={(event) => onChange(event.target.value)} aria-label="Active environment">
        {environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.name}</option>)}
      </select>
    </label>
  )
}

export default EnvironmentSelector
