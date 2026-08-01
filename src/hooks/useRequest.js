import { useState } from 'react'
import { executeRequest } from '../services/requestService'

export function useRequest() {
  const [response, setResponse] = useState(null)
  const [isSending, setIsSending] = useState(false)

  async function sendRequest(request) {
    setIsSending(true)
    try {
      const result = await executeRequest(request)
      setResponse({ ...result, error: null })
    } catch (error) {
      setResponse({ error: error.message || 'The request could not be completed.' })
    } finally {
      setIsSending(false)
    }
  }

  return { response, isSending, sendRequest }
}
