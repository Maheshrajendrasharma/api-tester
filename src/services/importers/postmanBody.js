export function normalizeBody(body) {

    if (!body)
        return ""

    return body.raw ?? ""

}