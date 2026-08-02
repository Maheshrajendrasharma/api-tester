import { useState } from 'react'
import { executeRequest } from '../services/requestService'
import { getActiveEnvironment } from '../services/environmentService'
import { resolveRequest } from '../utils/variableResolver'
import { getRequestHeaders } from '../utils/helpers'

export function useRequest(onRequestSuccess) {
  const [response, setResponse] = useState(null)
  const [isSending, setIsSending] = useState(false)

  async function sendRequest(request) {
    setIsSending(true)
    try {
      const resolvedRequest = resolveRequest(request, getActiveEnvironment())
      const result = await executeRequest({
        ...resolvedRequest,
        headers: getRequestHeaders(resolvedRequest.headers ?? []),
      })
      const nextResponse = { ...result, error: null }
      setResponse(nextResponse)
      onRequestSuccess?.({ request: resolvedRequest, response: result, resolvedUrl: resolvedRequest.url })
    } catch (error) {
      setResponse({ error: error.message || 'The request could not be completed.' })
    } finally {
      setIsSending(false)
    }
  }

  return { response, isSending, sendRequest }
}
