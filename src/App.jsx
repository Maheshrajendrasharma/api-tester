import './App.css'
import Sidebar from './components/Sidebar'
import RequestPanel from './components/RequestPanel'
import ResponsePanel from './components/ResponsePanel'

function App() {
  return (
    <main className="app-shell">
      <Sidebar />
      <section className="workspace" aria-label="API request workspace">
        <RequestPanel />
        <ResponsePanel />
      </section>
    </main>
  )
}

export default App
