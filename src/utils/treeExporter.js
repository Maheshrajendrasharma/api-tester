import { createId } from './requestModel'


function serializeRequest(request) {
  const postmanRequest = {
    method: request.method || 'GET',
    header: [],
    url: request.url || '',
  }


  // -----------------------------
  // Headers
  // -----------------------------

  if (Array.isArray(request.headers)) {
    postmanRequest.header = request.headers
      .filter((header) => header && header.key)
      .map((header) => ({
        key: header.key,
        value: header.value ?? '',
        ...(header.enabled === false
          ? { disabled: true }
          : {}),
      }))
  }


  // -----------------------------
  // Query parameters
  // -----------------------------

  if (Array.isArray(request.params) && request.params.length) {
    const query = request.params
      .filter((parameter) => parameter && parameter.key)
      .map((parameter) => ({
        key: parameter.key,
        value: parameter.value ?? '',
        ...(parameter.enabled === false
          ? { disabled: true }
          : {}),
      }))

    if (query.length) {
      postmanRequest.url = {
        raw: request.url || '',
        query,
      }
    }
  }


  // -----------------------------
  // Authorization
  // -----------------------------

  const authorization = request.authorization

  if (authorization && authorization.type) {
    switch (authorization.type) {

      case 'Bearer Token':
        if (authorization.bearerToken) {
          postmanRequest.auth = {
            type: 'bearer',
            bearer: [
              {
                key: 'token',
                value: authorization.bearerToken,
                type: 'string',
              },
            ],
          }
        }
        break


      case 'Basic Auth':
        postmanRequest.auth = {
          type: 'basic',
          basic: [
            {
              key: 'username',
              value: authorization.username || '',
              type: 'string',
            },
            {
              key: 'password',
              value: authorization.password || '',
              type: 'string',
            },
          ],
        }
        break


      case 'API Key':
        postmanRequest.auth = {
          type: 'apikey',
          apikey: [
            {
              key: 'key',
              value: authorization.apiKey || '',
              type: 'string',
            },
            {
              key: 'value',
              value: authorization.apiValue || '',
              type: 'string',
            },
            {
              key: 'in',
              value:
                authorization.apiKeyLocation === 'Query Parameter'
                  ? 'query'
                  : 'header',
              type: 'string',
            },
          ],
        }
        break

      default:
        break
    }
  }


  // -----------------------------
  // Body
  // -----------------------------

  if (
    request.body !== undefined &&
    request.body !== null &&
    String(request.body).trim() !== ''
  ) {
    postmanRequest.body = {
      mode: 'raw',
      raw: String(request.body),
      options: {
        raw: {
          language: 'json',
        },
      },
    }
  }


  return postmanRequest
}


function serializeRequestNode(node) {
  return {
    name: node.name || 'Request',

    request: serializeRequest(node),

    response: [],
  }
}


/*
 * Convert an API Tester tree node
 * into a Postman collection item.
 */
function serializeNode(node) {
  if (!node) {
    return null
  }


  // -----------------------------
  // Request
  // -----------------------------

  if (node.type === 'request') {
    return serializeRequestNode(node)
  }


  // -----------------------------
  // Folder
  // -----------------------------

  if (node.type === 'folder') {
    return {
      name: node.name || 'Folder',

      item: Array.isArray(node.children)
        ? node.children
            .map((child) => serializeNode(child))
            .filter(Boolean)
        : [],
    }
  }


  return null
}


/*
 * Convert the complete API Tester
 * collection tree to Postman format.
 */
export function exportTreeToPostman(collection) {
  if (!collection) {
    throw new Error('Collection is missing.')
  }


  const items = Array.isArray(collection.children)
    ? collection.children
        .map((child) => serializeNode(child))
        .filter(Boolean)
    : []


  return {
    info: {
      _postman_id: collection.id || createId(),

      name: collection.name || 'Exported Collection',

      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },

    item: items,
  }
}


/*
 * Return the Postman collection
 * as formatted JSON text.
 */
export function serializeTreeForExport(collection) {
  const postmanCollection = exportTreeToPostman(collection)

  return JSON.stringify(
    postmanCollection,
    null,
    2
  )
}