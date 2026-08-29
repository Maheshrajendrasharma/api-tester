import React, { useMemo, useState } from 'react'
import './runner.css'

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

const [running, setRunning] = useState(false)

const [executionMap, setExecutionMap] = useState({})


  const controller = useMemo(
    () => createRunnerController(),
    [open]
  )



  if (!open) {

    

    return null

  }



  




  function handleRun({ config, dataRows }) {


    const node = selectedNode || null



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




    const nodeId =

      node?.id ||

      initialNodeId ||

      collectionId




    if (!collectionId) {

      

      return

    }




    setRunning(true)



    setState({

      status: 'running',

      total: 0,

      completed: 0,

      passed: 0,

      failed: 0,

      results: []

    })





runNode({

  collections,

  collectionId,

  nodeId,

  config,

  dataRows,

  executeRequest,

  signal: controller.signal,


  onProgress: (progress) => {

    setState(progress)


    if (progress.event === 'request-start') {

      setExecutionMap(previous => ({

        ...previous,

        [progress.requestId]: {

          status: 'running'

        }

      }))

    }


    if (progress.event === 'request-complete') {

      setExecutionMap(previous => ({

        ...previous,

        [progress.requestId]: {

          status: progress.requestStatus

        }

      }))

    }

  },


  onResult: (runnerResult) => {


    


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

        :

        JSON.stringify(
          runnerResult.response ?? {},
          null,
          2
        ),


      error:
        runnerResult.error || null,


      runner:true,


      iteration:
        runnerResult.iteration

    })

  }


})
.finally(() => {

  setRunning(false)

})


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


disabled={running}


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