import CodeEditor from './CodeEditor'
import { formatResponseBody } from '../utils/formatters'

function ResponsePanel({
  response,
  environment,
  isSending,
  onCancel
}) {
  const hasResponse =
    response && !response.error

  const responseBody =
    response?.error ??
    (
      hasResponse
        ? formatResponseBody(
            response.responseBody
          )
        : 'Send a request to view the response.'
    )

  return (
    <section
      className="response-panel"
      aria-label="Response"
    >

<div className="response-header">

    <h2 className="response-heading">
        Response
    </h2>

    <div className="response-header-right">

        {isSending && (
            <button
                type="button"
                className="response-cancel-button"
                onClick={() => onCancel?.()}
            >
                Cancel Request
            </button>
        )}

        {hasResponse && (
            <div className="response-meta">

                <span>
                    Status
                    <strong>
                        {response.status}
                        {' '}
                        {response.statusText}
                    </strong>
                </span>

                <span>
                    Time {response.responseTime} ms
                </span>

                <span>
                    Size {response.responseSize} B
                </span>

            </div>
        )}

    </div>

</div>    


      <div
        className={`response-code-editor${
          response?.error
            ? ' response-error-editor'
            : ''
        }`}
      >

        <CodeEditor
          key={
            response?.responseBody ??
            'empty-response'
          }

          value={responseBody}

          language="json"

          environment={environment}

          readOnly={true}

        />

      </div>

    </section>
  )
}

export default ResponsePanel