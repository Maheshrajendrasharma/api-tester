// =====================================================
// SCRIPT RUNTIME STORE
// =====================================================

const scriptStore = new Map()


// =====================================================
// API OBJECT AVAILABLE TO USER SCRIPTS
// =====================================================

export const api = {

    // ---------------------------------------
    // SET
    // ---------------------------------------

    set(key, value) {

        const normalizedKey = String(key)

        scriptStore.set(
            normalizedKey,
            value
        )

        console.log(
            `[API] SET ${normalizedKey} =`,
            value
        )
    },


    // ---------------------------------------
    // GET
    // ---------------------------------------

    get(key) {

        const normalizedKey = String(key)

        const value =
            scriptStore.get(normalizedKey)

        console.log(
            `[API] GET ${normalizedKey} =`,
            value
        )

        return value
    },


    // ---------------------------------------
    // HAS
    // ---------------------------------------

    has(key) {

        const normalizedKey = String(key)

        const exists =
            scriptStore.has(normalizedKey)

        console.log(
            `[API] HAS ${normalizedKey} =`,
            exists
        )

        return exists
    },


    // ---------------------------------------
    // REMOVE
    // ---------------------------------------

    remove(key) {

        const normalizedKey = String(key)

        console.log(
            `[API] REMOVE ${normalizedKey}`
        )

        scriptStore.delete(
            normalizedKey
        )
    },


    // ---------------------------------------
    // CLEAR
    // ---------------------------------------

    clear() {

        console.log(
            '[API] CLEAR ALL VARIABLES'
        )

        scriptStore.clear()
    },

}


// =====================================================
// CLEAR RUNTIME VARIABLES
// =====================================================

export function clearRuntimeVariables() {

    console.log(
        '[SCRIPT RUNTIME] CLEARING VARIABLES'
    )

    scriptStore.clear()
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
                'console',
                `
                "use strict";

                ${script}
                `
            )


        await execute(
            api,
            console
        )


        console.log(
            '================================'
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
                'response',
                'console',
                `
                "use strict";

                ${script}
                `
            )


        await execute(
            api,
            response,
            console
        )


        console.log(
            '================================'
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