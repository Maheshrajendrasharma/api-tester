import {
  cancelRuntimeRequest,
  executeRuntimeRequest,
} from './runtimeService'

export async function executeRequest(request) {
  return executeRuntimeRequest(request)
}

export async function cancelRequest(requestId) {
  return cancelRuntimeRequest(requestId)
}
