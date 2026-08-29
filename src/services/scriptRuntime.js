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

    
}


export function getRuntimeVariable(key) {

    const normalizedKey = String(key)

    const value =
        scriptStore.get(normalizedKey)

    

    return value
}


export function hasRuntimeVariable(key) {

    const normalizedKey = String(key)

    const exists =
        scriptStore.has(normalizedKey)

    

    return exists
}


export function removeRuntimeVariable(key) {

    const normalizedKey = String(key)

    

    scriptStore.delete(
        normalizedKey
    )
}


export function clearRuntimeVariables() {

    

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

        

        return

    }


    

    

    


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

        

        return

    }


    

    

    


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