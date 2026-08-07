export function normalizeScripts(events = []) {

    const preRequest =
        events.find(event => event.listen === "prerequest")
            ?.script?.exec?.join("\n") ?? ""

    const postResponse =
        events.find(event => event.listen === "test")
            ?.script?.exec?.join("\n") ?? ""

    return {
        preRequest,
        postResponse,
    }

}