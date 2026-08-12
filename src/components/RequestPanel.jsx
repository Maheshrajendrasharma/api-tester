import ScriptEditor from "./ScriptEditor";
import { useEffect, useState } from 'react'
import AuthorizationEditor from './AuthorizationEditor'
import HeadersEditor from './HeadersEditor'
import ParamsEditor from './ParamsEditor'
import { getActiveParameters, removeGeneratedParameters } from '../utils/helpers'
import { HTTP_METHODS } from '../utils/constants'
import VariableField from './VariableField'
import { api } from "../services/scriptApi"


const tabs = ['Params', 'Headers', 'Authorization', 'Body','Scripts']

function RequestPanel({ environment, isSending, onSend, request, onRequestChange }) {
  const [activeTab, setActiveTab] = useState('Body')
  const [activeScriptTab, setActiveScriptTab] = useState("Pre-request")
  const [generatedParameters, setGeneratedParameters] = useState([])

useEffect(() => {
  setGeneratedParameters([])
}, [request?.id])

if (!request) {
  return (
    <section className="request-panel">
      <h1 style={{ color: "red" }}>REQUEST IS NULL</h1>
    </section>
  )
}

console.log({
    id: request.id,
    name: request.name,
    body: request.body
})

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

<div className="request-tab-content">


       {activeTab === "Params" && (
  <ParamsEditor
    environment={environment}
    parameters={
      request.params?.length
        ? request.params
        : [
            {
              id: 1,
              enabled: true,
              key: '',
              value: '',
              description: '',
            },
          ]
    }
    onChange={handleParametersChange}
  />
)}

{activeTab === "Headers" && (
  <div className="request-tab-scroll headers-tab-scroll">
    <HeadersEditor
      environment={environment}
      headers={request.headers ?? []}
      onChange={(headers) => updateRequest({ headers })}
    />
  </div>
)}


{activeTab === "Authorization" && (
  <div className="request-tab-scroll authorization-tab-scroll">
    <AuthorizationEditor
      environment={environment}
      authorization={request.authorization}
      onChange={(authorization) =>
        updateRequest({ authorization })
      }
    />
  </div>
)}



{activeTab === "Body" && (
  <div className="body-editor-area">
    <div className="body-toolbar">

  <div className="body-type-group">

    <select
      className="body-mode-select"
      value={request.bodyMode ?? "raw"}
      onChange={(e) =>
        updateRequest({
          bodyMode: e.target.value,
        })
      }
    >
      <option value="none">none</option>
      <option value="form-data">form-data</option>
      <option value="x-www-form-urlencoded">
        x-www-form-urlencoded
      </option>
      <option value="raw">raw</option>
      <option value="binary">binary</option>
      <option value="graphql">GraphQL</option>
    </select>

    {(request.bodyMode ?? "raw") === "raw" && (
      <select
        className="body-format-select"
        value={request.bodyFormat ?? "json"}
        onChange={(e) =>
          updateRequest({
            bodyFormat: e.target.value,
          })
        }
      >
        <option value="text">Text</option>
        <option value="javascript">JavaScript</option>
        <option value="json">JSON</option>
        <option value="html">HTML</option>
        <option value="xml">XML</option>
      </select>
    )}

    {(request.bodyMode ?? "raw") === "raw" && (
      <button
        type="button"
        className="beautify-button"
        onClick={() => {
          if ((request.bodyFormat ?? "json") !== "json") return

          try {
            const formatted = JSON.stringify(
              JSON.parse(request.body ?? ""),
              null,
              2
            )

            updateRequest({ body: formatted })
          } catch {
            // Keep invalid/incomplete JSON editable.
          }
        }}
      >
        Beautify
      </button>
    )}

  </div>

</div>

{(request.bodyMode ?? "raw") === "raw" && (
  <VariableField
    key={request.id}
    environment={environment}
    className="json-editor"
    multiline
    value={request.body ?? ""}
    onChange={(e) =>
      updateRequest({
        body: e.target.value,
      })
    }
  />
)}


  </div>
)}


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

 

</section>
 )}
export default RequestPanel
