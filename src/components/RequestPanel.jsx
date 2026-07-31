import { useState } from 'react'

const tabs = ['Params', 'Headers', 'Authorization', 'Body']
const defaultBody = `{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "developer"
}`

function RequestPanel() {
  const [activeTab, setActiveTab] = useState('Body')
  const [method, setMethod] = useState('GET')
  const [body, setBody] = useState(defaultBody)

  return (
    <section className="request-panel">
      <div className="request-title-row"><span className="request-dot" /><h1 className="request-title">Get users</h1></div>
      <div className="request-bar">
        <select aria-label="HTTP method" className="method-select" value={method} onChange={(event) => setMethod(event.target.value)}>
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input aria-label="Request URL" className="url-input" defaultValue="https://api.example.com/v1/users" />
        <button className="send-button" type="button">Send</button>
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
      ) : <div className="tab-placeholder">{activeTab} options will be available in a future phase.</div>}
    </section>
  )
}

export default RequestPanel
