import React, { useMemo, useState } from 'react'
import {
  createRunnerConfig,
  RUNNER_SCOPE,
} from '../../models/runnerModel'
import {
  buildIterationRows,
  parseRunnerDataFile,
} from '../../services/runnerDataSource'

export default function RunnerConfig({ onRun, disabled = false }) {
  const [config, setConfig] = useState(createRunnerConfig())
  const [dataMode, setDataMode] = useState('none')
  const [manualVariable, setManualVariable] = useState('')
  const [manualValues, setManualValues] = useState('')
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const manualList = useMemo(
    () => manualValues.split(/\r?\n/).map((v) => v.trim()).filter(Boolean),
    [manualValues]
  )

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError('')
      const parsedRows = await parseRunnerDataFile(file)
      setRows(parsedRows)
      setFileName(`${file.name} · ${parsedRows.length} rows`)
    } catch (err) {
      setRows([])
      setFileName('')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function update(key, value) {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  function submit() {
    const dataRows = buildIterationRows({
      mode: dataMode,
      rows,
      variable: manualVariable,
      values: manualList,
    })

    onRun?.({ config, dataRows })
  }

  return (
    <div className="runner-config">
      <div className="runner-section-title">Run scope</div>
      <div className="runner-scope-group">
        {Object.entries({
          [RUNNER_SCOPE.REQUEST]: 'Request',
          [RUNNER_SCOPE.FOLDER]: 'Folder',
          [RUNNER_SCOPE.COLLECTION]: 'Collection',
        }).map(([value, label]) => (
          <label key={value} className="runner-radio-row">
            <input
              type="radio"
              value={value}
              checked={config.scope === value}
              onChange={(event) => update('scope', event.target.value)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="runner-grid">
        <label>
          Iterations
          <input
            type="number"
            min="1"
            value={config.iterations}
            onChange={(event) => update('iterations', Number(event.target.value) || 1)}
          />
        </label>
        <label>
          Delay (ms)
          <input
            type="number"
            min="0"
            value={config.delayMs}
            onChange={(event) => update('delayMs', Number(event.target.value) || 0)}
          />
        </label>
        <label>
          Timeout (ms)
          <input
            type="number"
            min="100"
            value={config.timeoutMs}
            onChange={(event) => update('timeoutMs', Number(event.target.value) || 30000)}
          />
        </label>
      </div>

      <div className="runner-section-title">Data source</div>
      <div className="runner-data-mode">
        <label>
          <input
            type="radio"
            checked={dataMode === 'none'}
            onChange={() => setDataMode('none')}
          />
          None
        </label>
        <label>
          <input
            type="radio"
            checked={dataMode === 'manual'}
            onChange={() => setDataMode('manual')}
          />
          Manual variable
        </label>
        <label>
          <input
            type="radio"
            checked={dataMode === 'file'}
            onChange={() => setDataMode('file')}
          />
          CSV / Excel
        </label>
      </div>

      {dataMode === 'manual' && (
        <div className="runner-data-card">
          <label>
            Variable
            <input
              value={manualVariable}
              onChange={(event) => setManualVariable(event.target.value)}
              placeholder="customerName"
            />
          </label>
          <label>
            Values (one per line)
            <textarea
              rows={6}
              value={manualValues}
              onChange={(event) => setManualValues(event.target.value)}
              placeholder={'Mahesh\nRahul\nAmit'}
            />
          </label>
        </div>
      )}

      {dataMode === 'file' && (
        <div className="runner-data-card">
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFile}
          />
          {fileName && <div className="runner-file-name">{fileName}</div>}
          {rows[0] && (
            <div className="runner-columns">
              {Object.keys(rows[0]).map((key) => (
                <span key={key}>{key}</span>
              ))}
            </div>
          )}
          {error && <div className="runner-error">{error}</div>}
        </div>
      )}

      <div className="runner-options">
        <label><input type="checkbox" checked={config.runPreRequest} onChange={(e) => update('runPreRequest', e.target.checked)} /> Run pre-request scripts</label>
        <label><input type="checkbox" checked={config.runTests} onChange={(e) => update('runTests', e.target.checked)} /> Run tests</label>
        <label><input type="checkbox" checked={config.stopOnError} onChange={(e) => update('stopOnError', e.target.checked)} /> Stop on first failure</label>
        <label><input type="checkbox" checked={config.persistEnvironmentVariables} onChange={(e) => update('persistEnvironmentVariables', e.target.checked)} /> Persist environment variables</label>
      </div>

      <button
        type="button"
        className="runner-primary-button"
        disabled={disabled}
        onClick={submit}
      >
        ▶ Run
      </button>
    </div>
  )
}
