import { useEffect, useState } from 'react'

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
    activeEnvironment,
    activeRequestId
) {

    /*
     * Store the latest response separately for every request.
     *
     * {
     *   requestId1: response,
     *   requestId2: response,
     *   requestId3: response
     * }
     */
    const [responsesByRequestId, setResponsesByRequestId] =
        useState({})

    /*
     * Response currently displayed in the Response panel.
     */
    const [response, setResponse] =
        useState(null)

    const [isSending, setIsSending] =
        useState(false)


    /*
     * =========================================================
     * CHANGE DISPLAYED RESPONSE WHEN REQUEST SELECTION CHANGES
     * =========================================================
     *
     * If this request has been executed before:
     *
     *     show its previous response
     *
     * If it has never been executed:
     *
     *     show blank response
     */

    useEffect(() => {

        if (!activeRequestId) {

            setResponse(null)

            return

        }


        const previousResponse =
            responsesByRequestId[activeRequestId]


        setResponse(
            previousResponse ?? null
        )

    }, [
        activeRequestId,
        responsesByRequestId,
    ])


    async function sendRequest(request) {

        setIsSending(true)


        /*
         * Capture the request ID at the moment
         * Send is clicked.
         *
         * This is important if the user changes
         * the selected request while the HTTP call
         * is still running.
         */

        const requestId =
            request?.id


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

                JSON.parse(
                    resolvedRequest.body
                )

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

            console.log(
                '================================'
            )

            console.log(
                '[REQUEST] ABOUT TO RUN POST-RESPONSE SCRIPT'
            )

            console.log(
                '[REQUEST] Post-response script:'
            )

            console.log(
                request.scripts?.postResponse
            )

            console.log(
                '[REQUEST] Response passed to script:'
            )

            console.log(
                result
            )

            console.log(
                '================================'
            )

            await runPostResponseScript(
                request.scripts?.postResponse,
                result
            )

            console.log(
                '================================'
            )

            console.log(
                '[REQUEST] POST-RESPONSE SCRIPT FINISHED'
            )

            console.log(
                '================================'
            )


            // =================================================
            // 6. STORE RESPONSE
            // =================================================

            const nextResponse = {

                ...result,

                error: null,

            }


            /*
             * Store response against THIS request.
             */

            setResponsesByRequestId(
                (currentResponses) => ({

                    ...currentResponses,

                    [requestId]:
                        nextResponse,

                })
            )


            /*
             * Only update the visible Response panel
             * if the user is STILL viewing this request.
             *
             * If the user has already selected another
             * request, don't overwrite that request's response.
             */

            if (
                requestId === activeRequestId
            ) {

                setResponse(
                    nextResponse
                )

            }


            // =================================================
            // 7. CREATE HISTORY AFTER RESPONSE UPDATE
            // =================================================

            setTimeout(() => {

                console.log('================================')

                console.log(
                    '[REQUEST] RESPONSE DISPLAYED - CREATING HISTORY'
                )

                onRequestSuccess?.({

                    request:
                        resolvedRequest,

                    response:
                        result,

                    resolvedUrl:
                        resolvedRequest.url,

                })

                console.log(
                    '[REQUEST] HISTORY CALLBACK COMPLETED'
                )

                console.log(
                    '================================'
                )

            }, 0)


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


            const errorResponse = {

                error:
                    error?.message ||
                    'The request could not be completed.',

            }


            /*
             * Store error against this request too.
             */

            setResponsesByRequestId(
                (currentResponses) => ({

                    ...currentResponses,

                    [requestId]:
                        errorResponse,

                })
            )


            /*
             * Only display the error if this request
             * is still selected.
             */

            if (
                requestId === activeRequestId
            ) {

                setResponse(
                    errorResponse
                )

            }


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