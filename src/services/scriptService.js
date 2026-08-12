export function createScriptApi() {
    const variables = new Map()

    return {
        get(key) {
            return variables.get(key)
        },

        set(key, value) {
            variables.set(key, value)
        },

        remove(key) {
            variables.delete(key)
        },

        clear() {
            variables.clear()
        },
    }
}