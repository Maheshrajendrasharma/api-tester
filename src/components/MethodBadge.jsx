function MethodBadge({ method }) {
  return <span className={`method-badge method-${method.toLowerCase()}`}>{method}</span>
}

export default MethodBadge
