import { useState } from 'react'
import AuthorizationEditor from './AuthorizationEditor'
import HeadersEditor from './HeadersEditor'
import ParamsEditor from './ParamsEditor'

const tabs = ['Params', 'Headers', 'Authorization', 'Body']
const defaultBody = `{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "developer"
}`
const defaultHeaders = [{ id: 1, enabled: true, key: 'Content-Type', value: 'application/json' }]

function getActiveParameters(parameters) {
  return parameters.filter((parameter) => parameter.enabled && parameter.key.trim())
}

function getRequestHeaders(headers) {
  return headers.reduce((result, header) => {
    if (header.enabled && header.key.trim()) {
      result[header.key.trim()] = header.value
    }
    return result
  }, {})
}

function removeGeneratedParameters(searchParams, generatedParameters) {
  for (const parameter of generatedParameters) {
    const values = searchParams.getAll(parameter.key)
    const generatedValue = parameter.value
    const generatedValueIndex = values.indexOf(generatedValue)

    if (generatedValueIndex !== -1) {
      searchParams.delete(parameter.key)
      values.filter((_, index) => index !== generatedValueIndex).forEach((value) => searchParams.append(parameter.key, value))
    }
  }
}

function RequestPanel({ isSending, onSend }) {
  const [activeTab, setActiveTab] = useState('Body')
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1')
  const [headers, setHeaders] = useState(defaultHeaders)
  const [body, setBody] = useState(defaultBody)
  const [parameters, setParameters] = useState([{ id: 1, enabled: true, key: '', value: '' }])
  const [generatedParameters, setGeneratedParameters] = useState([])
  const [authorization, setAuthorization] = useState({
    type: 'None',
    bearerToken: '',
    username: '',
    password: '',
    apiKey: '',
    apiValue: '',
    apiKeyLocation: 'Header',
  })

  function handleParametersChange(nextParameters) {
    const nextGeneratedParameters = getActiveParameters(nextParameters)

    try {
      const parsedUrl = new URL(url)
      removeGeneratedParameters(parsedUrl.searchParams, generatedParameters)
      nextGeneratedParameters.forEach((parameter) => parsedUrl.searchParams.append(parameter.key, parameter.value))
      setUrl(parsedUrl.toString())
      setGeneratedParameters(nextGeneratedParameters)
    } catch {
      // Keep incomplete or invalid URLs editable; request validation happens in the request engine.
    }

    setParameters(nextParameters)
  }

  function sendRequest() {
    onSend({ method, url, headers: getRequestHeaders(headers), body })
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
      {activeTab === 'Params' ? (
        <ParamsEditor parameters={parameters} onChange={handleParametersChange} />
      ) : activeTab === 'Body' ? (
        <div className="body-editor-area">
          <label className="body-label" htmlFor="request-body">raw · JSON</label>
          <textarea className="json-editor" id="request-body" value={body} onChange={(event) => setBody(event.target.value)} spellCheck="false" />
        </div>
      ) : activeTab === 'Headers' ? (
        <HeadersEditor headers={headers} onChange={setHeaders} />
      ) : activeTab === 'Authorization' ? (
        <AuthorizationEditor authorization={authorization} onChange={setAuthorization} />
      ) : <div className="tab-placeholder">{activeTab} options will be available in a future phase.</div>}
    </section>
  )
}

export default RequestPanel
