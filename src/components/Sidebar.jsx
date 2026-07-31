const collections = [
  { name: 'Sample API', requests: [{ method: 'GET', name: 'Get users', active: true }, { method: 'POST', name: 'Create user' }] },
  { name: 'Development', requests: [{ method: 'GET', name: 'Health check' }] },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">A</span>API Tester</div>
      <div className="sidebar-section-header"><span>Collections</span></div>
      <button className="new-collection-button" type="button">+ New Collection</button>
      <nav className="collection-list" aria-label="Collections">
        {collections.map((collection) => (
          <div key={collection.name}>
            <div className="collection-name"><span className="collection-arrow">⌄</span><span className="collection-folder">▰</span>{collection.name}</div>
            {collection.requests.map((request) => (
              <div className={`request-item${request.active ? ' active' : ''}`} key={request.name}>
                <span className="request-method">{request.method}</span><span>{request.name}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
