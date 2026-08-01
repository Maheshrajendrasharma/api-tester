import { formatResponseBody } from '../utils/formatters'

function ResponsePanel({ response }) {
  const hasResponse = response && !response.error
  const responseBody = response?.error ?? (hasResponse ? formatResponseBody(response.responseBody) : 'Send a request to view the response.')

  return (
    <section className="response-panel" aria-label="Response">
      <div className="response-header">
        <h2 className="response-heading">Response</h2>
        {hasResponse && <div className="response-meta"><span>Status <strong>{response.status} {response.statusText}</strong></span><span>Time {response.responseTime} ms</span><span>Size {response.responseSize} B</span></div>}
      </div>
      <pre className={`response-body${response?.error ? ' response-error' : ''}`}>{responseBody}</pre>
    </section>
  )
}

export default ResponsePanel
