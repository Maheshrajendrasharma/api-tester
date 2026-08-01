import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'

function App() {
  const [response, setResponse] = useState(null)
  const [isSending, setIsSending] = useState(false)

  async function handleSend(request) {
    setIsSending(true)
    try {
      if (!window.apiTester?.sendRequest) {
    throw new Error(
        "Electron API bridge not available. Please run inside the Electron desktop application."
    );
}

const result = await window.apiTester.sendRequest(request);
      setResponse({ ...result, error: null })
    } catch (error) {
      setResponse({ error: error.message || 'The request could not be completed.' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <Workspace isSending={isSending} onSend={handleSend} response={response} />
    </main>
  )
}

export default App
