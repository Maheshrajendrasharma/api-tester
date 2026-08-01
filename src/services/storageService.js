export async function loadCollections() {
  return window.apiTester?.loadCollections?.() || []
}

export async function saveCollections(collections) {
  if (window.apiTester?.saveCollections) await window.apiTester.saveCollections(collections)
}
