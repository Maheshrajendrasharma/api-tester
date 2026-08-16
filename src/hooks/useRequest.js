import { useState } from 'react'

import { executeRequest } from '../services/requestService'

import {
    resolveRequest,
    findUnresolvedVariables,
} from '../utils/variableResolver'

import { getRequestHeaders } from '../utils/helpers'

import {
    runPreRequestScript,
    runPostResponseScript,
} from '../services/scriptRuntime'


export function useRequest(
    onRequestSuccess,
    activeEnvironment
) {

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
// 2. GET ACTIVE WORKSPACE ENVIRONMENT
// =================================================

const environment =
    activeEnvironment

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

    // =================================================
// 3A. CHECK FOR UNRESOLVED VARIABLES
// =================================================

const unresolvedVariables = []


/*
 * Check URL
 */

const unresolvedUrl =
    findUnresolvedVariables(
        resolvedRequest.url
    )

unresolvedUrl.forEach(
    (variable) => {

        unresolvedVariables.push({
            ...variable,
            location: 'URL',
        })

    }
)


/*
 * Check body
 */

const unresolvedBody =
    findUnresolvedVariables(
        resolvedRequest.body
    )

unresolvedBody.forEach(
    (variable) => {

        unresolvedVariables.push({
            ...variable,
            location: 'Body',
        })

    }
)


/*
 * Check headers
 */

if (
    Array.isArray(
        resolvedRequest.headers
    )
) {

    resolvedRequest.headers.forEach(
        (header) => {

            const unresolvedHeader =
                findUnresolvedVariables(
                    header?.value
                )

            unresolvedHeader.forEach(
                (variable) => {

                    unresolvedVariables.push({
                        ...variable,
                        location:
                            `Header "${header.key}"`,
                    })

                }
            )

        }
    )

}


/*
 * Check authorization
 */

if (
    resolvedRequest.authorization &&
    typeof resolvedRequest.authorization === 'object'
) {

    Object.entries(
        resolvedRequest.authorization
    ).forEach(
        ([field, value]) => {

            const unresolvedAuth =
                findUnresolvedVariables(
                    value
                )

            unresolvedAuth.forEach(
                (variable) => {

                    unresolvedVariables.push({
                        ...variable,
                        location:
                            `Authorization "${field}"`,
                    })

                }
            )

        }
    )

}


/*
 * STOP REQUEST IF VARIABLES ARE MISSING
 */

if (
    unresolvedVariables.length > 0
) {

    const first =
        unresolvedVariables[0]


    const message =
        `Unresolved variable "{{${first.key}}}" ` +
        `in ${first.location} ` +
        `at line ${first.line}, ` +
        `column ${first.column}. ` +
        `Please add "${first.key}" to the active environment.`


    console.error(
        '[REQUEST] UNRESOLVED VARIABLE:',
        first
    )


    throw new Error(
        message
    )

}        



            console.log(
                '[REQUEST] RESOLVED HEADERS:',
                resolvedRequest.headers
            )


            console.log(
                '[REQUEST] RESOLVED BODY:',
                resolvedRequest.body
            )


            try {
    JSON.parse(resolvedRequest.body)

    console.log(
        '[DEBUG] BODY JSON IS VALID'
    )
} catch (error) {

    console.error(
        '[DEBUG] BODY JSON IS INVALID'
    )

    console.error(
        '[DEBUG] JSON ERROR:',
        error.message
    )

    console.error(
        '[DEBUG] BODY:',
        resolvedRequest.body
    )
}




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