export async function executeRequest(request) {
  if (!window.apiTester?.sendRequest) {
    throw new Error('Electron API bridge not available. Please run inside the Electron desktop application.')
  }
  return window.apiTester.sendRequest(request)
}
