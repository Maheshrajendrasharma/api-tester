import { useState } from 'react'

const tabs = ['Params', 'Headers', 'Authorization', 'Body']
const defaultBody = `{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "developer"
}`
const defaultHeaders = `{
  "Content-Type": "application/json"
}`

function RequestPanel({ isSending, onSend }) {
  const [activeTab, setActiveTab] = useState('Body')
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1')
  const [headers, setHeaders] = useState(defaultHeaders)
  const [body, setBody] = useState(defaultBody)
  const [inputError, setInputError] = useState('')

  function sendRequest() {
    let parsedHeaders
    try {
      parsedHeaders = JSON.parse(headers)
    } catch {
      setInputError('Headers must be valid JSON.')
      setActiveTab('Headers')
      return
    }

    if (!parsedHeaders || Array.isArray(parsedHeaders) || typeof parsedHeaders !== 'object') {
      setInputError('Headers must be a JSON object.')
      setActiveTab('Headers')
      return
    }

    setInputError('')
    onSend({ method, url, headers: parsedHeaders, body })
  }

  return (
    <section className="request-panel">
      <div className="request-title-row"><span className="request-dot" /><h1 className="request-title">Get users</h1></div>
      <div className="request-bar">
        <select aria-label="HTTP method" className="method-select" value={method} onChange={(event) => setMethod(event.target.value)}>
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input aria-label="Request URL" className="url-input" value={url} onChange={(event) => setUrl(event.target.value)} />
        <button className="send-button" type="button" onClick={sendRequest} disabled={isSending}>{isSending ? 'Sending…' : 'Send'}</button>
      </div>
      <div className="tabs" role="tablist" aria-label="Request options">
        {tabs.map((tab) => (
          <button className={`tab-button${activeTab === tab ? ' active' : ''}`} key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>
      {activeTab === 'Body' ? (
        <div className="body-editor-area">
          <label className="body-label" htmlFor="request-body">raw · JSON</label>
          <textarea className="json-editor" id="request-body" value={body} onChange={(event) => setBody(event.target.value)} spellCheck="false" />
        </div>
      ) : activeTab === 'Headers' ? (
        <div className="body-editor-area">
          <label className="body-label" htmlFor="request-headers">JSON headers</label>
          <textarea className="json-editor" id="request-headers" value={headers} onChange={(event) => setHeaders(event.target.value)} spellCheck="false" />
          {inputError && <p className="input-error">{inputError}</p>}
        </div>
      ) : <div className="tab-placeholder">{activeTab} options will be available in a future phase.</div>}
    </section>
  )
}

export default RequestPanel
