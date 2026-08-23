function SidebarRow({
  children,
  className = '',
  onClick,
  selected = false,
  ...props
}) {

  function handleKeyDown(event) {
    if (
      event.target === event.currentTarget &&
      onClick &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault()
      onClick()
    }
  }


  return (
    <div
      {...props}
      className={`sidebar-row${selected ? ' selected' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

export default SidebarRow