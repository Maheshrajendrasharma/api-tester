import React from 'react'

export default function RunnerResults({ state }) {
  if (!state || state.status === 'idle') {
    return (
      <div className="runner-results-empty">
        Run a request, folder, or collection to see results here.
      </div>
    )
  }

  return (
    <div className="runner-results">
      <div className="runner-result-summary">
        <span>{state.total} total</span>
        <span>✓ {state.passed}</span>
        <span>✕ {state.failed}</span>
        <span>{state.completed} completed</span>
      </div>

      <div className="runner-result-list">
        {state.results.map((result) => (
          <div key={result.id} className={`runner-result-row ${result.status}`}>
            <span className="runner-result-icon">
              {result.status === 'passed' ? '✓' : '✕'}
            </span>
            <div className="runner-result-main">
              <strong>{result.requestName}</strong>
              <span>Iteration {result.iteration}</span>
            </div>
            <span>{result.statusCode ?? '—'}</span>
            <span>{result.responseTime ?? '—'} ms</span>
          </div>
        ))}
      </div>
    </div>
  )
}
