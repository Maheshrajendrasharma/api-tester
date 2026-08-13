import { pm } from "./postmanCompat"

// =====================================================
// SCRIPT RUNTIME STORE
// =====================================================

const scriptStore = new Map()


// =====================================================
// RUNTIME VARIABLE FUNCTIONS
// =====================================================

export function setRuntimeVariable(key, value) {

    const normalizedKey = String(key)

    scriptStore.set(
        normalizedKey,
        value
    )

    console.log(
        `[SCRIPT RUNTIME] SET ${normalizedKey} =`,
        value
    )
}


export function getRuntimeVariable(key) {

    const normalizedKey = String(key)

    const value =
        scriptStore.get(normalizedKey)

    console.log(
        `[SCRIPT RUNTIME] GET ${normalizedKey} =`,
        value
    )

    return value
}


export function hasRuntimeVariable(key) {

    const normalizedKey = String(key)

    const exists =
        scriptStore.has(normalizedKey)

    console.log(
        `[SCRIPT RUNTIME] HAS ${normalizedKey} =`,
        exists
    )

    return exists
}


export function removeRuntimeVariable(key) {

    const normalizedKey = String(key)

    console.log(
        `[SCRIPT RUNTIME] REMOVE ${normalizedKey}`
    )

    scriptStore.delete(
        normalizedKey
    )
}


export function clearRuntimeVariables() {

    console.log(
        '[SCRIPT RUNTIME] CLEAR ALL VARIABLES'
    )

    scriptStore.clear()
}


// =====================================================
// API OBJECT AVAILABLE TO USER SCRIPTS
// =====================================================

export const api = {

    set(key, value) {

        setRuntimeVariable(
            key,
            value
        )

    },


    get(key) {

        return getRuntimeVariable(
            key
        )

    },


    has(key) {

        return hasRuntimeVariable(
            key
        )

    },


    remove(key) {

        removeRuntimeVariable(
            key
        )

    },


    clear() {

        clearRuntimeVariables()

    },

}


// =====================================================
// PRE-REQUEST SCRIPT
// =====================================================

export async function runPreRequestScript(script) {

    if (
        !script ||
        !script.trim()
    ) {

        console.log(
            '[SCRIPT] No pre-request script'
        )

        return

    }


    console.log(
        '================================'
    )

    console.log(
        '[SCRIPT] PRE-REQUEST START'
    )

    console.log(
        '================================'
    )


    try {

        const execute =
            new Function(
                'api',
                'pm',
                'console',
                `
                "use strict";

                ${script}
                `
            )


        await execute(
            api,
            pm,
            console
        )


        console.log(
            '[SCRIPT] PRE-REQUEST END'
        )

        console.log(
            '================================'
        )

    } catch (error) {

        console.error(
            '[SCRIPT] PRE-REQUEST FAILED:',
            error
        )

        throw new Error(
            `Pre-request script failed: ${error.message}`
        )

    }

}


// =====================================================
// POST-RESPONSE SCRIPT
// =====================================================

export async function runPostResponseScript(
    script,
    response
) {

    if (
        !script ||
        !script.trim()
    ) {

        console.log(
            '[SCRIPT] No post-response script'
        )

        return

    }


    console.log(
        '================================'
    )

    console.log(
        '[SCRIPT] POST-RESPONSE START'
    )

    console.log(
        '================================'
    )


    try {

        const execute =
            new Function(
                'api',
                'pm',
                'response',
                'console',
                `
                "use strict";

                ${script}
                `
            )


        await execute(
            api,
            pm,
            response,
            console
        )


        console.log(
            '[SCRIPT] POST-RESPONSE END'
        )

        console.log(
            '================================'
        )

    } catch (error) {

        console.error(
            '[SCRIPT] POST-RESPONSE FAILED:',
            error
        )

        throw new Error(
            `Post-response script failed: ${error.message}`
        )

    }

}