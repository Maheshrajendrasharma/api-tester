import ScriptEditor from "./ScriptEditor";
import { useEffect, useState } from 'react'
import AuthorizationEditor from './AuthorizationEditor'
import HeadersEditor from './HeadersEditor'
import ParamsEditor from './ParamsEditor'
import { getActiveParameters, removeGeneratedParameters } from '../utils/helpers'
import { HTTP_METHODS } from '../utils/constants'
import VariableField from './VariableField'

const tabs = ['Params', 'Headers', 'Authorization', 'Body','Scripts']

function RequestPanel({ environment, isSending, onSend, request, onRequestChange }) {
  const [activeTab, setActiveTab] = useState('Body')
  const [activeScriptTab, setActiveScriptTab] = useState("Pre-request")
  const [generatedParameters, setGeneratedParameters] = useState([])

  useEffect(() => {
    setGeneratedParameters([])
  }, [request?.id])

  console.log("Request =", request)

if (!request) {
  return (
    <section className="request-panel">
      <h1 style={{ color: "red" }}>REQUEST IS NULL</h1>
    </section>
  )
}

  function updateRequest(changes) {
    onRequestChange({ ...request, ...changes })
  }

  function handleParametersChange(nextParameters) {
    const nextGeneratedParameters = getActiveParameters(nextParameters)
    let nextUrl = request.url

    try {
      const parsedUrl = new URL(request.url)
      removeGeneratedParameters(parsedUrl.searchParams, generatedParameters)
      nextGeneratedParameters.forEach((parameter) => parsedUrl.searchParams.append(parameter.key, parameter.value))
      nextUrl = parsedUrl.toString()
      setGeneratedParameters(nextGeneratedParameters)
    } catch {
      // Keep incomplete or invalid URLs editable; request validation happens in the request engine.
    }

    updateRequest({ params: nextParameters, url: nextUrl })
  }

  function sendRequest() {
    onSend(request)
  }

  return (
    <section className="request-panel">
      <div className="request-title-row"><span className="request-dot" /><h1 className="request-title">{request.name}</h1></div>
      <div className="request-bar">
        <select aria-label="HTTP method" className="method-select" value={request.method} onChange={(event) => updateRequest({ method: event.target.value })} title={`${request.method} Request`}>
          {HTTP_METHODS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <VariableField environment={environment} aria-label="Request URL" className="url-input" value={request.url} onChange={(event) => updateRequest({ url: event.target.value })} />
        <button className="send-button" type="button" onClick={sendRequest} disabled={isSending}>{isSending ? 'Sending…' : 'Send'}</button>
      </div>
      <div className="tabs" role="tablist" aria-label="Request options">
        {tabs.map((tab) => (
          <button className={`tab-button${activeTab === tab ? ' active' : ''}`} key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>
       {activeTab === "Params" && (
  <ParamsEditor
    environment={environment}
    parameters={request.params}
    onChange={handleParametersChange}
  />
)}

{activeTab === "Headers" && (
  <HeadersEditor
    environment={environment}
    headers={request.headers}
    onChange={(headers) => updateRequest({ headers })}
  />
)}

{activeTab === "Authorization" && (
  <AuthorizationEditor
    environment={environment}
    authorization={request.authorization}
    onChange={(authorization) =>
      updateRequest({ authorization })
    }
  />
)}

{activeTab === "Body" && (
  <div className="body-editor-area">
    <label className="body-label">raw · JSON</label>

    <VariableField
      environment={environment}
      className="json-editor"
      multiline
      value={request.body}
      onChange={(e) =>
        updateRequest({ body: e.target.value })
      }
    />
  </div>
)}

{activeTab === "Scripts" && (
  <div className="scripts-editor">
    {activeTab === "Scripts" && (

<div className="script-container">

    <div className="script-sidebar">

        <button
            className={
                activeScriptTab==="Pre-request"
                    ? "active"
                    : ""
            }
            onClick={()=>
                setActiveScriptTab("Pre-request")
            }
        >
            Pre-request
        </button>

        <button
            className={
                activeScriptTab==="Post-response"
                    ? "active"
                    : ""
            }
            onClick={()=>
                setActiveScriptTab("Post-response")
            }
        >
            Post-response
        </button>

    </div>

    <div className="script-main">

        <ScriptEditor
            value={
                activeScriptTab==="Pre-request"
                    ? request.scripts?.preRequest ?? ""
                    : request.scripts?.postResponse ?? ""
            }

            placeholder="Write JavaScript here..."

            onChange={(event)=>{

                updateRequest({

                    scripts:{
                        ...(request.scripts ?? {}),

                        [activeScriptTab==="Pre-request"
                            ? "preRequest"
                            : "postResponse"
                        ]:event.target.value

                    }

                })

            }}

        />

    </div>

</div>

)}
  </div>
)}   </section>
  )
}

export default RequestPanel
