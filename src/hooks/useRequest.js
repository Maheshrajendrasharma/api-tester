import { useState } from 'react'
import { executeRequest } from '../services/requestService'
import { getActiveEnvironment } from '../services/environmentService'
import { resolveRequest } from '../utils/variableResolver'
import { getRequestHeaders } from '../utils/helpers'

import {
    runPreRequestScript,
    runPostResponseScript,
} from '../services/scriptRuntime'

export function useRequest(onRequestSuccess) {
  const [response, setResponse] = useState(null)
  const [isSending, setIsSending] = useState(false)

  async function sendRequest(request) {

    setIsSending(true)

    try {

        console.log('================================')
        console.log('[REQUEST] START')
        console.log('================================')

        // ---------------------------------------
        // 1. PRE-REQUEST SCRIPT
        // ---------------------------------------

        await runPreRequestScript(
            request.scripts?.preRequest
        )


        // ---------------------------------------
        // 2. RESOLVE VARIABLES
        // ---------------------------------------

        const environment =
            getActiveEnvironment()

        const resolvedRequest =
            resolveRequest(
                request,
                environment
            )


        console.log(
            '[REQUEST] RESOLVED URL:',
            resolvedRequest.url
        )


        // ---------------------------------------
        // 3. SEND HTTP REQUEST
        // ---------------------------------------

        const result =
            await executeRequest({

                ...resolvedRequest,

                headers:
                    getRequestHeaders(
                        resolvedRequest.headers ?? []
                    ),

            })


        // ---------------------------------------
        // 4. STORE RESPONSE IN UI
        // ---------------------------------------

        const nextResponse = {
            ...result,
            error: null,
        }

        setResponse(nextResponse)


        // ---------------------------------------
        // 5. POST-RESPONSE SCRIPT
        // ---------------------------------------

        await runPostResponseScript(
            request.scripts?.postResponse,
            result
        )


        // ---------------------------------------
        // 6. SUCCESS CALLBACK
        // ---------------------------------------

        onRequestSuccess?.({

            request: resolvedRequest,

            response: result,

            resolvedUrl:
                resolvedRequest.url,

        })


    } catch (error) {

        console.error(
            '[REQUEST] FAILED:',
            error
        )

        setResponse({

            error:
                error.message ||
                'The request could not be completed.',

        })

    } finally {

        setIsSending(false)

    }
}

  return { response, isSending, sendRequest }
}
