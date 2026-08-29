import { useEffect, useRef, useState } from 'react'
import RequestPanel from './RequestPanel'
import ResponsePanel from './ResponsePanel'
import RunnerPanel from './Runner/RunnerPanel'

const dividerHeight = 6
const minimumRequestHeight = 220
const minimumResponseHeight = 180

function Workspace({
  environment,
  isSending,
  onSend,
  response,
  request,
  onCancel,
  onRequestChange,
  showRunner,
  runnerProps
}) {
  const workspaceRef = useRef(null)
  const cleanupDragRef = useRef(null)
  const [requestHeight, setRequestHeight] = useState(null)

  useEffect(() => () => cleanupDragRef.current?.(), [])

  function stopDragging() {
    window.removeEventListener('mousemove', resizePanels)
    window.removeEventListener('mouseup', stopDragging)
    document.body.classList.remove('is-resizing')
    cleanupDragRef.current = null
  }


function resizePanels(event) {
  const workspace = workspaceRef.current
  if (!workspace) return

  const workspaceBounds = workspace.getBoundingClientRect()

const minimumHeight = 220
const minimumResponseHeight = 180

const nextHeight =
  event.clientY - workspaceBounds.top

const maximumRequestHeight =
  workspaceBounds.height - minimumResponseHeight

  setRequestHeight(
    Math.min(
      Math.max(nextHeight, minimumHeight),
      maximumRequestHeight
    )
  )
}

  function startDragging(event) {
    event.preventDefault()
    document.body.classList.add('is-resizing')
    window.addEventListener('mousemove', resizePanels)
    window.addEventListener('mouseup', stopDragging)
    cleanupDragRef.current = stopDragging
  }

  function resetSplit() {
    setRequestHeight(null)
  }

  const splitStyle = requestHeight === null ? undefined : { '--request-height': `${requestHeight}px` }

return (
  <section
    className={`workspace${requestHeight === null ? '' : ' custom-split'}`}
    ref={workspaceRef}
    style={splitStyle}
    aria-label="API request workspace"
  >
{
showRunner ? (

  <RunnerPanel {...runnerProps} />

) : (

  <>
    <RequestPanel
      environment={environment}
      isSending={isSending}
      onSend={onSend}
      request={request}
      onRequestChange={onRequestChange}
      onCancel={onCancel}
    />

    <div
      className="workspace-divider"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize request and response panels"
      onMouseDown={startDragging}
      onDoubleClick={resetSplit}
    />

    <ResponsePanel
      response={response}
      isSending={isSending}
      onCancel={onCancel}
      environment={environment}
    />
  </>
)
}
  </section>
)
}

export default Workspace
