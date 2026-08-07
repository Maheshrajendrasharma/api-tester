import { createId } from "../utils/requestModel";
import { normalizeAuthorization } from "./importers/postmanAuth";
import { normalizeBody } from "./importers/postmanBody";
import { normalizeScripts } from "./importers/postmanScripts";

export function importPostmanRequest(item) {

    const request = item?.request ?? {};

    const headers =
        (request.header ?? []).map(header => ({
            id: createId(),
            enabled: header.disabled !== true,
            key: header.key ?? "",
            value: header.value ?? "",
        }));

    const params =
        (request.url?.query ?? []).map(parameter => ({
            id: createId(),
            enabled: parameter.disabled !== true,
            key: parameter.key ?? "",
            value: parameter.value ?? "",
        }));

    return {

        name: item.name ?? "Request",

        method: request.method ?? "GET",

        url:
            typeof request.url === "string"
                ? request.url
                : request.url?.raw ?? "",

        headers,

        params,

        authorization: normalizeAuthorization(request.auth),

        body: normalizeBody(request.body),

        scripts: normalizeScripts(item.event),

        description:
            request.description ??
            item.description ??
            "",

    };

}