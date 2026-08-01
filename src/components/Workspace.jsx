import { useEffect, useRef, useState } from 'react'
import RequestPanel from './RequestPanel'
import ResponsePanel from './ResponsePanel'

const dividerHeight = 6
const minimumRequestHeight = 220
const minimumResponseHeight = 180

function Workspace({ isSending, onSend, response, request, onRequestChange }) {
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
    const availableHeight = workspaceBounds.height - dividerHeight
    const maximumRequestHeight = Math.min(availableHeight * 0.8, availableHeight - minimumResponseHeight)
    const minimumHeight = Math.min(minimumRequestHeight, maximumRequestHeight)
    const nextHeight = event.clientY - workspaceBounds.top

    setRequestHeight(Math.min(Math.max(nextHeight, minimumHeight), maximumRequestHeight))
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
    <section className={`workspace${requestHeight === null ? '' : ' custom-split'}`} ref={workspaceRef} style={splitStyle} aria-label="API request workspace">
      <RequestPanel isSending={isSending} onSend={onSend} request={request} onRequestChange={onRequestChange} />
      <div className="workspace-divider" role="separator" aria-orientation="horizontal" aria-label="Resize request and response panels" onMouseDown={startDragging} onDoubleClick={resetSplit} />
      <ResponsePanel response={response} />
    </section>
  )
}

export default Workspace
