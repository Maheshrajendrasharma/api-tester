import { cloneElement, useEffect, useRef, useState } from 'react'

const defaultSidebarWidth = 280
const minimumSidebarWidth = 220
const maximumSidebarWidth = 450
const sidebarWidthStorageKey = 'api-tester-sidebar-width'
const sidebarCollapsedStorageKey = 'api-tester-sidebar-collapsed'
const defaultEnvironmentPanelWidth = 340
const minimumEnvironmentPanelWidth = 250
const maximumEnvironmentPanelWidth = 500
const environmentPanelWidthStorageKey = 'api-tester-environment-panel-width'
const environmentPanelCollapsedStorageKey = 'api-tester-environment-panel-collapsed'

function getSavedSidebarWidth() {
  const savedWidth = Number(window.localStorage.getItem(sidebarWidthStorageKey))
  return savedWidth >= minimumSidebarWidth && savedWidth <= maximumSidebarWidth ? savedWidth : defaultSidebarWidth
}

function getSavedEnvironmentPanelWidth() {
  const savedWidth = Number(window.localStorage.getItem(environmentPanelWidthStorageKey))
  return savedWidth >= minimumEnvironmentPanelWidth && savedWidth <= maximumEnvironmentPanelWidth ? savedWidth : defaultEnvironmentPanelWidth
}

function AppLayout({ header, sidebar, environmentPanel, children }) {
  const layoutRef = useRef(null)
  const cleanupDragRef = useRef(null)
  const [sidebarWidth, setSidebarWidth] = useState(getSavedSidebarWidth)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true')
  const [environmentPanelWidth, setEnvironmentPanelWidth] = useState(getSavedEnvironmentPanelWidth)
  const [isEnvironmentPanelCollapsed, setIsEnvironmentPanelCollapsed] = useState(() => window.localStorage.getItem(environmentPanelCollapsedStorageKey) === 'true')
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => () => cleanupDragRef.current?.(), [])

  useEffect(() => {
    window.localStorage.setItem(sidebarWidthStorageKey, String(sidebarWidth))
  }, [sidebarWidth])

  useEffect(() => {
    window.localStorage.setItem(sidebarCollapsedStorageKey, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => {
    window.localStorage.setItem(environmentPanelWidthStorageKey, String(environmentPanelWidth))
  }, [environmentPanelWidth])

  useEffect(() => {
    window.localStorage.setItem(environmentPanelCollapsedStorageKey, String(isEnvironmentPanelCollapsed))
  }, [isEnvironmentPanelCollapsed])

  function startDragging(event, onDrag) {
    event.preventDefault()
    cleanupDragRef.current?.()
    document.body.classList.remove('is-resizing')
    document.body.classList.add('is-resizing')
    setIsResizing(true)

    function stopDragging() {
      window.removeEventListener('mousemove', onDrag)
      window.removeEventListener('mouseup', stopDragging)
      document.body.classList.remove('is-resizing')
      cleanupDragRef.current = null
      setIsResizing(false)
    }

    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDragging)
    cleanupDragRef.current = stopDragging
  }

  function resizeSidebar(event) {
    const layout = layoutRef.current
    if (!layout) return
    const layoutBounds = layout.getBoundingClientRect()
    const nextWidth = event.clientX - layoutBounds.left
    setSidebarWidth(Math.min(Math.max(nextWidth, minimumSidebarWidth), maximumSidebarWidth))
  }

  function resizeEnvironmentPanel(event) {
    const layout = layoutRef.current
    if (!layout) return
    const layoutBounds = layout.getBoundingClientRect()
    const nextWidth = layoutBounds.right - event.clientX
    setEnvironmentPanelWidth(Math.min(Math.max(nextWidth, minimumEnvironmentPanelWidth), maximumEnvironmentPanelWidth))
  }

  function collapseEnvironmentPanel() {
    setIsEnvironmentPanelCollapsed(true)
  }

  function expandEnvironmentPanel() {
    setIsEnvironmentPanelCollapsed(false)
  }


  function toggleEnvironmentPanel() {
  setIsEnvironmentPanelCollapsed((collapsed) => !collapsed)
}

  return (
    <main className="app-shell">
      {header}
      <div className="app-layout" ref={layoutRef} style={{ '--sidebar-width': isSidebarCollapsed ? '0px' : `${sidebarWidth}px`, '--sidebar-divider-width': isSidebarCollapsed ? '0px' : '6px', '--sidebar-handle-left': isSidebarCollapsed ? '0px' : `${sidebarWidth}px`, '--environment-panel-width': isEnvironmentPanelCollapsed ? '0px' : `${environmentPanelWidth}px`, '--environment-divider-width': isEnvironmentPanelCollapsed ? '0px' : '6px', '--panel-transition-duration': isResizing ? '0ms' : '225ms' }}>
{cloneElement(sidebar, {
  onToggleEnvironmentPanel: toggleEnvironmentPanel,
})}

<div
  className="sidebar-divider"
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize sidebar"
  onMouseDown={(event) =>
    !isSidebarCollapsed && startDragging(event, resizeSidebar)
  }
  onDoubleClick={() => setSidebarWidth(defaultSidebarWidth)}
  style={{
    opacity: isSidebarCollapsed ? 0 : 1,
    pointerEvents: isSidebarCollapsed ? "none" : "auto",
  }}
/>

<div
  className="app-layout-main"
  style={{
    minWidth: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position:"relative",
  }}
>
  {children}
</div>



<div
  className="environment-panel-divider"
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize environment panel"
  onMouseDown={(event) =>
    !isEnvironmentPanelCollapsed &&
    startDragging(event, resizeEnvironmentPanel)
  }
  onDoubleClick={() => setEnvironmentPanelWidth(defaultEnvironmentPanelWidth)}
  style={{
    opacity: isEnvironmentPanelCollapsed ? 0 : 1,
    pointerEvents: isEnvironmentPanelCollapsed ? "none" : "auto",
  }}
/>

        {environmentPanel}
        <button className="sidebar-collapse-handle" type="button" onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)} aria-label={isSidebarCollapsed ? 'Expand collections sidebar' : 'Collapse collections sidebar'}>{isSidebarCollapsed ? '›' : '‹'}</button>
        {!isEnvironmentPanelCollapsed && <button className="environment-collapse-handle" type="button" onClick={collapseEnvironmentPanel} aria-label="Collapse environment panel">›</button>}
        {isEnvironmentPanelCollapsed && <button className="environment-panel-expand-handle" type="button" onClick={expandEnvironmentPanel} aria-label="Expand environment panel">‹</button>}
      </div>
    </main>
  )
}

export default AppLayout
