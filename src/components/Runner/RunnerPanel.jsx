import './runner.css'

import React, {
  useRef,
  useState
} from 'react'

import RunnerTree from './RunnerTree'
import RunnerConfig from './RunnerConfig'

import {
  runNode,
  createRunnerController
} from '../../services/runnerService'
import { cancelRequest as cancelRuntimeRequest } from '../../services/requestService'


export default function RunnerPanel({
  open = false,
  collections = [],
  initialCollectionId = null,
  initialNodeId = null,
  executeRequest,
  onRunnerHistoryEntry,
  onClose,
}) {


const [selectedNode, setSelectedNode] = useState(null)

const [state, setState] = useState(null)

const [paused, setPaused] = useState(false)


const [running, setRunning] = useState(false)

const [executionMap, setExecutionMap] = useState({})


const controllerRef = useRef(null)



  if (!open) {

    

    return null

  }



  




function handleRun({ config, dataRows }) {
  performance.mark?.('api-tester:runner-start')

  // --------------------------------------------------
  // Create a NEW controller for every Run
  // --------------------------------------------------
  const runnerController = createRunnerController()

  controllerRef.current = runnerController



  // --------------------------------------------------
  // Selected node
  // --------------------------------------------------
  const node = selectedNode || null



  // --------------------------------------------------
  // Find collection
  // --------------------------------------------------
  const collectionId =
    initialCollectionId ||
    collections.find((collection) =>
      collection.id === node?.id ||
      Boolean(
        node &&
        collection.children?.some(
          (child) => child.id === node.id
        )
      )
    )?.id



  // --------------------------------------------------
  // Determine node ID
  // --------------------------------------------------
  const nodeId =
    node?.id ||
    initialNodeId ||
    collectionId



  // --------------------------------------------------
  // Validate collection
  // --------------------------------------------------
  if (!collectionId) {

    console.error(
      '[RUNNER] No collectionId found'
    )

    setRunning(false)
    setPaused(false)

    return
  }


  // --------------------------------------------------
  // Start runner UI
  // --------------------------------------------------
setRunning(true)
setPaused(false)

setExecutionMap({})

setState({
  status: 'running',
  total: 0,
  completed: 0,
  passed: 0,
  failed: 0,
  results: []
})



  // --------------------------------------------------
  // START RUNNER
  // --------------------------------------------------
  runNode({

    collections,

    collectionId,

    nodeId,

    config,

    dataRows,

    executeRequest,

    signal:
      runnerController.signal,

    waitIfPaused:
      runnerController.waitIfPaused,


    // ------------------------------------------------
    // PROGRESS
    // ------------------------------------------------
    onProgress: (progress) => {

  setState(progress)


  // -----------------------------------------------
  // REQUEST START
  // -----------------------------------------------

  if (
    progress.event === 'request-start'
  ) {

    setExecutionMap(
      (previous) => ({

        ...previous,

        [progress.requestId]: {

          ...(previous[progress.requestId] || {}),

          status: 'running'

        }

      })
    )
  }


  // -----------------------------------------------
  // REQUEST COMPLETE
  // -----------------------------------------------

  if (
    progress.event === 'request-complete'
  ) {

    setExecutionMap(
      (previous) => ({

        ...previous,

        [progress.requestId]: {

          ...(previous[progress.requestId] || {}),

          status:
            progress.requestStatus

        }

      })
    )
  }

},

    // ------------------------------------------------
    // RESULT
    // ------------------------------------------------
    onResult: (runnerResult, executionMeta) => {

const requestId =
  executionMeta?.requestId ||
  runnerResult.request?.id

setExecutionMap((previous) => ({
  ...previous,

  [requestId]: {
    ...(previous[requestId] || {}),

    status:
      runnerResult.status === 'passed'
        ? 'success'
        : 'failed',

    statusCode:
      runnerResult.statusCode ?? null,

    responseTime:
      runnerResult.responseTime ?? null,

    iteration:
      runnerResult.iteration ?? null,
  },
}))
      onRunnerHistoryEntry?.({



        name:
          runnerResult.requestName ||
          'Unnamed Request',

        method:
          runnerResult.request?.method ||
          'GET',

        url:
          runnerResult.request?.url ||
          '',

        resolvedUrl:
          runnerResult.request?.url ||
          '',

        statusCode:
          runnerResult.statusCode,

        statusText:
          runnerResult.status,

        responseTime:
          runnerResult.responseTime,

        responseBody:

          typeof runnerResult.response === 'string'

            ? runnerResult.response

            : JSON.stringify(
                runnerResult.response ??
                {},
                null,
                2
              ),

        error:
          runnerResult.error ||
          null,

        runner: true,

        iteration:
          runnerResult.iteration

      })

    }

  })

  .then(() => {

  })

  .catch((error) => {

    console.error('[RUNNER] failed:', error instanceof Error ? error.message : String(error))

    setState((previous) => ({

      ...(previous || {}),

      status: 'failed',

      error:
        error instanceof Error
          ? error.message
          : String(error)

    }))

  })

  .finally(() => {

    performance.mark?.('api-tester:runner-finished')

    setRunning(false)

    setPaused(false)

    controllerRef.current = null

  })

}


function handlePause() {
  controllerRef.current?.pause()
  setPaused(true)
}

function handleResume() {
  controllerRef.current?.resume()
  setPaused(false)
}

async function handleCancel() {

  // Cancel the runner controller
  controllerRef.current?.cancel()


  // Get currently running request
  const requestId =
    state?.currentRequestId


  if (requestId) {

    try {

      await cancelRuntimeRequest(requestId)

    } catch (error) {

      console.error('[RUNNER] cancellation failed:', error?.message || String(error))

    }

  }


  setRunning(false)
  setPaused(false)

}



  return (

    <div className="runner-overlay">


      <div className="runner-panel">



        {/* HEADER */}

        <div className="runner-header">


          <div>

            <div className="runner-title">

              Collection Runner

            </div>


            <div className="runner-subtitle">

              Request · Folder · Collection + CSV / Excel

            </div>


          </div>




          <button

            type="button"

            className="runner-close"

            onClick={onClose}

          >

            ×

          </button>


        </div>






        {/* BODY */}
<div className="runner-layout">

  {/* -------------------------------------------------
      LEFT - CONFIG
  ------------------------------------------------- */}

  <section className="runner-middle">

    <RunnerConfig
      onRun={handleRun}
      onPause={handlePause}
      onResume={handleResume}
      onCancel={handleCancel}
      running={running}
      paused={paused}
    />

  </section>


  {/* -------------------------------------------------
      RIGHT - TARGET + EXECUTION
  ------------------------------------------------- */}

  <section className="runner-target-panel">

    <div className="runner-section-title">
      Select Target & Execution
    </div>


    {/* -----------------------------------------------
        EXECUTION SUMMARY
    ------------------------------------------------ */}

    {state && (

      <div className="runner-inline-summary">

        <span>
          {state.total ?? 0} total
        </span>

        <span>
          ✓ {state.passed ?? 0}
        </span>

        <span>
          ✕ {state.failed ?? 0}
        </span>

        <span>
          {state.completed ?? 0} completed
        </span>

      </div>

    )}


    {/* -----------------------------------------------
        TARGET TREE
    ------------------------------------------------ */}

    <div className="runner-target-tree">

      <RunnerTree
        collections={collections}

        selectedId={
          selectedNode?.id ||
          initialNodeId
        }

        executionMap={executionMap}

        onSelect={setSelectedNode}
      />

    </div>

  </section>

</div>

      </div>


    </div>

  )


}
