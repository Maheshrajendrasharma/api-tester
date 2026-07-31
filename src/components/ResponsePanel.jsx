const responseBody = `{
  "data": [
    { "id": 1, "name": "Ada Lovelace", "role": "developer" },
    { "id": 2, "name": "Grace Hopper", "role": "engineer" }
  ],
  "total": 2
}`

function ResponsePanel() {
  return (
    <section className="response-panel" aria-label="Response">
      <div className="response-header">
        <h2 className="response-heading">Response</h2>
        <div className="response-meta"><span>Status <strong>200 OK</strong></span><span>Time 124 ms</span><span>Size 482 B</span></div>
      </div>
      <pre className="response-body">{responseBody}</pre>
    </section>
  )
}

export default ResponsePanel
