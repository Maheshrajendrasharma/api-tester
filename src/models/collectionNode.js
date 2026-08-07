    import { createId } from '../utils/requestModel'

    export function createCollectionNode(name = 'My Collection') {
    return {
        id: createId(),
        type: 'collection',
        name,
        expanded: true,
        children: [],
    }
    }

    export function createFolderNode(name = 'New Folder') {
    return {
        id: createId(),
        type: 'folder',
        name,
        expanded: true,
        children: [],
    }
    }

    export function createRequestNode(request) {
    return {
        ...request,
        id: request?.id ?? createId(),
        type: 'request',
        name: request?.name ?? 'New Request',
    }
    }