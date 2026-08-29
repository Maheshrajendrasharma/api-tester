import './runner.css'

import React, {
  useMemo,
  useRef,
  useState
} from 'react'

import RunnerTree from './RunnerTree'
import RunnerConfig from './RunnerConfig'
import RunnerResults from './RunnerResults'

import {
  runNode,
  createRunnerController
} from '../../services/runnerService'


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

  console.log('========== RUNNER START ==========')
  console.log('[RUNNER] config =', config)
  console.log('[RUNNER] dataRows =', dataRows)
  console.log('[RUNNER] selectedNode =', selectedNode)

  // --------------------------------------------------
  // Create a NEW controller for every Run
  // --------------------------------------------------
  const runnerController = createRunnerController()

  controllerRef.current = runnerController

  console.log('[RUNNER] controller created')
  console.log(
    '[RUNNER] initially paused =',
    runnerController.isPaused()
  )
  console.log(
    '[RUNNER] initially aborted =',
    runnerController.signal.aborted
  )


  // --------------------------------------------------
  // Selected node
  // --------------------------------------------------
  const node = selectedNode || null

  console.log('[RUNNER] node =', node)


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

  console.log(
    '[RUNNER] collectionId =',
    collectionId
  )


  // --------------------------------------------------
  // Determine node ID
  // --------------------------------------------------
  const nodeId =
    node?.id ||
    initialNodeId ||
    collectionId

  console.log(
    '[RUNNER] nodeId =',
    nodeId
  )

  console.log(
    '[RUNNER] scope =',
    config.scope
  )


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

  setState({
    status: 'running',
    total: 0,
    completed: 0,
    passed: 0,
    failed: 0,
    results: []
  })


  console.log(
    '[RUNNER] ABOUT TO CALL runNode()'
  )


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

      console.log(
        '[RUNNER PROGRESS]',
        progress
      )

      setState(progress)


      if (
        progress.event ===
        'request-start'
      ) {

        console.log(
          '[RUNNER REQUEST START]',
          progress.requestId
        )

        setExecutionMap(
          (previous) => ({

            ...previous,

            [progress.requestId]: {

              status: 'running'

            }

          })
        )
      }


      if (
        progress.event ===
        'request-complete'
      ) {

        console.log(
          '[RUNNER REQUEST COMPLETE]',
          progress.requestId,
          progress.requestStatus
        )

        setExecutionMap(
          (previous) => ({

            ...previous,

            [progress.requestId]: {

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
    onResult: (runnerResult) => {

      console.log(
        '[RUNNER RESULT]',
        runnerResult
      )


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

  .then((finalState) => {

    console.log(
      '[RUNNER] runNode() completed',
      finalState
    )

  })

  .catch((error) => {

    console.error(
      '========== RUNNER ERROR =========='
    )

    console.error(
      error
    )

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

    console.log(
      '[RUNNER] FINISHED'
    )

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

  console.log(
    '[RUNNER CANCEL] requested'
  )


  // Cancel the runner controller
  controllerRef.current?.cancel()


  // Get currently running request
  const requestId =
    state?.currentRequestId


  console.log(
    '[RUNNER CANCEL] current requestId =',
    requestId
  )


  // Cancel active Electron HTTP request
  if (
    requestId &&
    window.apiTester?.cancelRequest
  ) {

    try {

      const result =
        await window.apiTester.cancelRequest(
          requestId
        )

      console.log(
        '[RUNNER CANCEL] Electron cancel result =',
        result
      )

    } catch (error) {

      console.error(
        '[RUNNER CANCEL] Electron cancellation failed:',
        error
      )

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





        {/* LEFT CONFIG */}

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







{/* CENTER TREE */}

<section className="runner-left">


<div className="runner-section-title">

Select target

</div>



<div className="runner-tree">


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







          {/* RIGHT RESULT */}

          <section className="runner-right">


            <div className="runner-section-title">

              Execution

            </div>



            <RunnerResults

              state={state}

            />


          </section>




        </div>


      </div>


    </div>

  )


}