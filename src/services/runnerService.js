import {
  createRunnerResult,
  createRunnerState,
} from '../models/runnerModel'
import { resolveRunnerRequests } from '../utils/runnerTree'

function sleep(ms, signal) {

  if (!ms) {
    return Promise.resolve()
  }

  if (signal?.aborted) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {

    const timer = setTimeout(
      resolve,
      ms
    )

    const handleAbort = () => {

      clearTimeout(timer)

      resolve()

    }

    signal?.addEventListener(
      'abort',
      handleAbort,
      { once: true }
    )

  })
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
  waitIfPaused,
}) {

    console.log('========== runNode START ==========')

  console.log(
    '[runNode] collectionId =',
    collectionId
  )

  console.log(
    '[runNode] nodeId =',
    nodeId
  )

  console.log(
    '[runNode] scope =',
    config?.scope
  )

  console.log(
    '[runNode] iterations =',
    config?.iterations
  )

  console.log(
    '[runNode] dataRows =',
    dataRows
  )

  if (typeof executeRequest !== 'function') {
    throw new Error('Runner requires an executeRequest function.')
  }


  console.log(
  '[runNode] BEFORE resolveRunnerRequests'
)



  const resolved = resolveRunnerRequests({
    collections,
    collectionId,
    nodeId,
    scope: config.scope,
  })

  console.log(
  '[runNode] AFTER resolveRunnerRequests'
)

console.log(
  '[runNode] resolved =',
  resolved
)

console.log(
  '[runNode] request count =',
  resolved?.requests?.length
)

if (!resolved) {
  throw new Error(
    'Runner could not resolve the selected target.'
  )
}

if (!Array.isArray(resolved.requests)) {
  throw new Error(
    'Runner target resolution did not return a requests array.'
  )
}

if (resolved.requests.length === 0) {
  throw new Error(
    `No requests found for ${config.scope} target.`
  )
}

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

  console.log(
    '[runNode] NEXT ITEM',
    {
      requestId: item.request?.id,
      iteration: item.iteration,
    }
  )

  await waitIfPaused?.()

  if (signal?.aborted) {

    console.log(
      '[runNode] ABORT DETECTED'
    )

    state.status = 'cancelled'

    break
  }


  const started = performance.now()

  state.currentRequestId = item.request.id
  state.currentIteration = item.iteration

  onProgress?.({
    ...state,
    event: 'request-start',
    requestId: item.request.id,
    requestStatus: 'running',
  })

  try {
      console.log(
  "========== RUNNER ITEM REQUEST =========="
)

console.log(
 JSON.stringify(item.request,null,2)
)

console.log(
 "METHOD:",
 item.request.method
)

console.log(
 "URL:",
 item.request.url
)

console.log(
 "BODY:",
 item.request.body
)
const result = await executeRequest({
  ...item.request,
  __requestId: item.request.id,
})

console.log("RUNNER EXECUTE RESPONSE", result)

const responseTime =
  Math.round(performance.now() - started)

const statusCode =
  Number(
    result?.statusCode ??
    result?.response?.status ??
    result?.status ??
    result?.response?.statusCode ??
    NaN
  )

const hasHttpStatus =
  Number.isFinite(statusCode)

const passed =
  result?.error == null &&
  (
    hasHttpStatus
      ? statusCode >= 200 && statusCode < 300
      : result?.ok === true
  )

const runnerResult = createRunnerResult({
        request: item.request,
        iteration: item.iteration,
        row: item.row,
        status: passed ? 'passed' : 'failed',
statusCode: hasHttpStatus
  ? statusCode
  : null,        responseTime,
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
    ...state,
    requestId: item.request.id,
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

        if (
    signal?.aborted ||
    error?.name === 'AbortError'
  ) {
    console.log(
      '[runNode] REQUEST ABORTED / RUNNER CANCELLED'
    )

    state.status = 'cancelled'
    break
  }

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
    ...state,
    requestId: item.request.id,
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

    await sleep(
  config.delayMs,
  signal
)
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

  let paused = false

  let resumeResolver = null


  function pause() {

    if (controller.signal.aborted) {
      return
    }

    paused = true

    console.log('[RUNNER CONTROLLER] PAUSED')
  }


  function resume() {

    paused = false

    console.log('[RUNNER CONTROLLER] RESUMED')

    if (resumeResolver) {

      const resolve =
        resumeResolver

      resumeResolver = null

      resolve()
    }
  }


  async function waitIfPaused() {

    if (!paused) {
      return
    }

    if (controller.signal.aborted) {
      return
    }

    await new Promise((resolve) => {

      resumeResolver = resolve

    })

  }


  function cancel() {

    console.log(
      '[RUNNER CONTROLLER] CANCEL'
    )

    paused = false

    if (resumeResolver) {

      const resolve =
        resumeResolver

      resumeResolver = null

      resolve()
    }

    controller.abort()
  }


  return {

    signal:
      controller.signal,

    cancel,

    pause,

    resume,

    waitIfPaused,

    isPaused:
      () => paused,

  }
}