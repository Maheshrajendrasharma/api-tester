import {
  createRunnerResult,
  createRunnerState,
} from '../models/runnerModel'
import { resolveRunnerRequests } from '../utils/runnerTree'

function sleep(ms) {
  if (!ms) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function runNode({
  collections,
  collectionId,
  nodeId,
  config,
  dataRows = [{}],
  executeRequest,
  onProgress,
  onResult,
  signal,
}) {
  if (typeof executeRequest !== 'function') {
    throw new Error('Runner requires an executeRequest function.')
  }

  const resolved = resolveRunnerRequests({
    collections,
    collectionId,
    nodeId,
    scope: config.scope,
  })

  const iterations = Math.max(1, Number(config.iterations) || 1)
  const rows = dataRows.length ? dataRows : [{}]
  const plan = []

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    const row = rows[(iteration - 1) % rows.length]
    for (const request of resolved.requests) {
      plan.push({ request, iteration, row })
    }
  }

  const state = createRunnerState()
  state.status = 'running'
  state.total = plan.length
  state.startedAt = new Date().toISOString()

  onProgress?.({ ...state })

  for (const item of plan) {
    if (signal?.aborted) {
      state.status = 'cancelled'
      break
    }

const started = performance.now()

state.currentRequestId = item.request.id
state.currentIteration = item.iteration


onProgress?.({

  ...state,

  event: "request-start",

  requestId: item.request.id,

  requestStatus: "running"

})

    try {
      const result = await executeRequest({
        request: item.request,
        iteration: item.iteration,
        row: item.row,
        config,
        signal,
      })

      const responseTime = Math.round(performance.now() - started)
      const passed = result?.error == null && result?.ok !== false

      const runnerResult = createRunnerResult({
        request: item.request,
        iteration: item.iteration,
        row: item.row,
        status: passed ? 'passed' : 'failed',
        statusCode: result?.statusCode ?? result?.response?.status ?? null,
        responseTime,
        response: result?.response ?? result,
        error: result?.error ?? null,
        tests: result?.tests ?? [],
      })

      state.results.push(runnerResult)
      state.completed += 1

      if (passed) {
        state.passed += 1
      } else {
        state.failed += 1
      }

onResult?.(
  runnerResult,
  {
    ...state
  }
)


onProgress?.({

  ...state,

  event:"request-complete",

  requestId:item.request.id,

  requestStatus: passed
      ? "success"
      : "failed"

})

      if (!passed && config.stopOnError) {
        state.status = 'failed'
        break
      }
    } catch (error) {
      const runnerResult = createRunnerResult({
        request: item.request,
        iteration: item.iteration,
        row: item.row,
        status: 'failed',
        responseTime: Math.round(performance.now() - started),
        error: error instanceof Error ? error.message : String(error),
      })

      state.results.push(runnerResult)
      state.completed += 1
      state.failed += 1

onResult?.(
  runnerResult,
  {
    ...state
  }
)


onProgress?.({

  ...state,

  event:"request-complete",

  requestId:item.request.id,

  requestStatus:"failed"

})

      if (config.stopOnError) {
        state.status = 'failed'
        break
      }
    }

    await sleep(config.delayMs)
  }

  if (state.status === 'running') {
    state.status = state.failed > 0 ? 'completed-with-errors' : 'completed'
  }

  state.finishedAt = new Date().toISOString()
  state.currentRequestId = null
  onProgress?.({ ...state })

  return state
}

export function createRunnerController() {
  const controller = new AbortController()
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  }
}
