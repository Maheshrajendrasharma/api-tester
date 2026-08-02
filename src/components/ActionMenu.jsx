import { useEffect, useRef, useState } from 'react'

function ActionMenu({ label, actions }) {
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false)
    }

    if (isOpen) document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [isOpen])

  function handleMenuKeyDown(event) {
    const menuItems = [...event.currentTarget.querySelectorAll('[role="menuitem"]')]
    const currentIndex = menuItems.indexOf(document.activeElement)

    if (menuItems.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + menuItems.length) % menuItems.length
      menuItems[nextIndex]?.focus()
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      event.currentTarget.querySelector('button')?.focus()
    }
  }

  function openMenuWithKeyboard(event) {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    setIsOpen(true)
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus())
  }

  return (
    <div className="action-menu" ref={menuRef} onClick={(event) => event.stopPropagation()} onKeyDown={handleMenuKeyDown}>
      <button className="action-menu-trigger" type="button" aria-label={label} aria-haspopup="menu" aria-expanded={isOpen} data-tooltip={label} onClick={() => setIsOpen((open) => !open)} onKeyDown={openMenuWithKeyboard}>⋮</button>
      {isOpen && (
        <div className="action-menu-popover" role="menu" aria-label={label}>
          {actions.map((action) => (
            <button className={action.destructive ? 'destructive' : ''} key={action.label} type="button" role="menuitem" disabled={action.disabled} title={action.disabled ? action.tooltip || 'Coming Soon' : undefined} onClick={() => { if (action.disabled) return; setIsOpen(false); action.onClick() }}>{action.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActionMenu
