import { useEffect, useState } from 'react'

import {
  cancelRequest as cancelRuntimeRequest,
  executeRequest,
} from '../services/requestService'
import { findUnresolvedVariables, resolveRequest } from '../utils/variableResolver'
import { getRequestHeaders } from '../utils/helpers'
import { runPostResponseScript, runPreRequestScript } from '../services/scriptRuntime'

function collectUnresolvedVariables(request) {
  const unresolved = []
  const add = (value, location) => {
    findUnresolvedVariables(value).forEach((variable) => unresolved.push({ ...variable, location }))
  }

  add(request.url, 'URL')
  add(request.body, 'Body')
  if (Array.isArray(request.headers)) {
    request.headers.forEach((header) => add(header?.value, `Header "${header?.key ?? ''}"`))
  }
  if (request.authorization && typeof request.authorization === 'object') {
    Object.entries(request.authorization).forEach(([field, value]) => add(value, `Authorization "${field}"`))
  }
  return unresolved
}

export function useRequest(onRequestSuccess, activeEnvironment, activeRequestId) {
  const [responsesByRequestId, setResponsesByRequestId] = useState({})
  const [response, setResponse] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [sendingRequestId, setSendingRequestId] = useState(null)

  useEffect(() => {
    setResponse(activeRequestId ? responsesByRequestId[activeRequestId] ?? null : null)
  }, [activeRequestId, responsesByRequestId])

  async function sendRequest(request) {
    const requestId = request?.id
    setIsSending(true)
    setSendingRequestId(requestId ?? null)
    performance.mark?.('api-tester:request-start')

    try {
      await runPreRequestScript(request?.scripts?.preRequest)
      const resolvedRequest = resolveRequest(request, activeEnvironment)
      const unresolvedVariables = collectUnresolvedVariables(resolvedRequest)
      if (unresolvedVariables.length > 0) {
        const first = unresolvedVariables[0]
        throw new Error(
          `Unresolved variable "{{${first.key}}}" in ${first.location} at line ${first.line}, ` +
          `column ${first.column}. Please add "${first.key}" to the active environment.`
        )
      }

      const result = await executeRequest({
        ...resolvedRequest,
        __requestId: requestId,
        headers: getRequestHeaders(resolvedRequest.headers ?? []),
      })
      await runPostResponseScript(request?.scripts?.postResponse, result)

      const nextResponse = { ...result, error: null }
      setResponsesByRequestId((current) => ({ ...current, [requestId]: nextResponse }))
      if (requestId === activeRequestId) setResponse(nextResponse)

      setTimeout(() => onRequestSuccess?.({
        request: resolvedRequest,
        response: result,
        resolvedUrl: resolvedRequest.url,
      }), 0)

      return nextResponse
    } catch (error) {
      const message = error?.message || 'The request could not be completed.'
      console.error('[REQUEST] failed:', message)
      const errorResponse = { error: message }
      setResponsesByRequestId((current) => ({ ...current, [requestId]: errorResponse }))
      if (requestId === activeRequestId) setResponse(errorResponse)
      return errorResponse
    } finally {
      performance.mark?.('api-tester:request-finished')
      setIsSending(false)
      setSendingRequestId(null)
    }
  }

  async function cancelRequest() {
    if (!sendingRequestId) return false
    const cancelled = await cancelRuntimeRequest(sendingRequestId)
    if (cancelled) console.info('[REQUEST] cancelled')
    return cancelled
  }

  return { response, isSending, sendRequest, cancelRequest }
}
