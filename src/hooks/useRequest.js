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


            // =================================================
            // 1. PRE-REQUEST SCRIPT
            // =================================================

            console.log(
                '[REQUEST] RUNNING PRE-REQUEST SCRIPT'
            )

            await runPreRequestScript(
                request?.scripts?.preRequest
            )


            console.log(
                '[REQUEST] PRE-REQUEST SCRIPT COMPLETED'
            )


            // =================================================
            // 2. GET ACTIVE ENVIRONMENT
            // =================================================

            const environment =
                getActiveEnvironment()


            console.log(
                '[REQUEST] ACTIVE ENVIRONMENT:',
                environment
            )


            // =================================================
            // 3. RESOLVE VARIABLES
            // =================================================

            console.log(
                '[REQUEST] RESOLVING VARIABLES'
            )


            const resolvedRequest =
                resolveRequest(
                    request,
                    environment
                )


            console.log(
                '[REQUEST] RESOLVED URL:',
                resolvedRequest.url
            )


            console.log(
                '[REQUEST] RESOLVED HEADERS:',
                resolvedRequest.headers
            )


            console.log(
                '[REQUEST] RESOLVED BODY:',
                resolvedRequest.body
            )


            // =================================================
            // 4. SEND HTTP REQUEST
            // =================================================

            console.log(
                '[REQUEST] SENDING HTTP REQUEST'
            )


            const result =
                await executeRequest({

                    ...resolvedRequest,

                    headers:
                        getRequestHeaders(
                            resolvedRequest.headers ?? []
                        ),

                })


            console.log(
                '[REQUEST] HTTP REQUEST COMPLETED'
            )


            console.log(
                '[REQUEST] RESPONSE:',
                result
            )


            // =================================================
            // 5. POST-RESPONSE SCRIPT
            // =================================================

            console.log(
                '[REQUEST] RUNNING POST-RESPONSE SCRIPT'
            )


console.log("================================")
console.log("[REQUEST] ABOUT TO RUN POST-RESPONSE SCRIPT")
console.log("[REQUEST] Post-response script:")
console.log(request.scripts?.postResponse)
console.log("[REQUEST] Response passed to script:")
console.log(result)
console.log("================================")

await runPostResponseScript(
    request.scripts?.postResponse,
    result
)

console.log("================================")
console.log("[REQUEST] POST-RESPONSE SCRIPT FINISHED")
console.log("================================")


            console.log(
                '[REQUEST] POST-RESPONSE SCRIPT COMPLETED'
            )


            // =================================================
            // 6. STORE RESPONSE IN UI
            // =================================================

            const nextResponse = {

                ...result,

                error: null,

            }


            setResponse(
                nextResponse
            )


            // =================================================
            // 7. SUCCESS CALLBACK
            // =================================================

            onRequestSuccess?.({

                request:
                    resolvedRequest,

                response:
                    result,

                resolvedUrl:
                    resolvedRequest.url,

            })


            console.log(
                '[REQUEST] COMPLETE'
            )

            console.log(
                '================================'
            )


        } catch (error) {

            console.error(
                '================================'
            )

            console.error(
                '[REQUEST] FAILED'
            )

            console.error(
                'ERROR:',
                error
            )

            console.error(
                '================================'
            )


            setResponse({

                error:
                    error?.message ||
                    'The request could not be completed.',

            })


        } finally {

            setIsSending(false)

        }

    }


    return {

        response,

        isSending,

        sendRequest,

    }

}