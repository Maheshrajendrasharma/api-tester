import { useEffect, useRef, useState } from 'react'

const defaultSidebarWidth = 280
const minimumSidebarWidth = 220
const maximumSidebarWidth = 450
const sidebarWidthStorageKey = 'api-tester-sidebar-width'

function getSavedSidebarWidth() {
  const savedWidth = Number(window.localStorage.getItem(sidebarWidthStorageKey))
  return savedWidth >= minimumSidebarWidth && savedWidth <= maximumSidebarWidth ? savedWidth : defaultSidebarWidth
}

function AppLayout({ sidebar, children }) {
  const layoutRef = useRef(null)
  const cleanupDragRef = useRef(null)
  const [sidebarWidth, setSidebarWidth] = useState(getSavedSidebarWidth)

  useEffect(() => () => cleanupDragRef.current?.(), [])

  useEffect(() => {
    window.localStorage.setItem(sidebarWidthStorageKey, String(sidebarWidth))
  }, [sidebarWidth])

  function stopDragging() {
    window.removeEventListener('mousemove', resizeSidebar)
    window.removeEventListener('mouseup', stopDragging)
    document.body.classList.remove('is-resizing')
    cleanupDragRef.current = null
  }

  function resizeSidebar(event) {
    const layout = layoutRef.current
    if (!layout) return
    const layoutBounds = layout.getBoundingClientRect()
    const nextWidth = event.clientX - layoutBounds.left
    setSidebarWidth(Math.min(Math.max(nextWidth, minimumSidebarWidth), maximumSidebarWidth))
  }

  function startDragging(event) {
    event.preventDefault()
    document.body.classList.add('is-resizing')
    window.addEventListener('mousemove', resizeSidebar)
    window.addEventListener('mouseup', stopDragging)
    cleanupDragRef.current = stopDragging
  }

  return (
    <main className="app-shell" ref={layoutRef} style={{ '--sidebar-width': `${sidebarWidth}px` }}>
      {sidebar}
      <div className="sidebar-divider" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" onMouseDown={startDragging} onDoubleClick={() => setSidebarWidth(defaultSidebarWidth)} />
      {children}
    </main>
  )
}

export default AppLayout
