import EnvironmentSelector from './EnvironmentSelector'

function Header({ environments, onEnvironmentChange }) {
  return (
    <header className="app-header">
      <div className="app-header-brand">
        <span className="app-header-mark" aria-hidden="true">A</span>
        <span>API Tester</span>
      </div>
      <EnvironmentSelector environments={environments} onChange={onEnvironmentChange} />
    </header>
  )
}

export default Header
