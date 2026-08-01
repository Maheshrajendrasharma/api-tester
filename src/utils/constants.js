export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
export const AUTH_TYPES = ['None', 'Bearer Token', 'Basic Auth', 'API Key']
export const API_KEY_LOCATIONS = ['Header', 'Query Parameter']
export const DEFAULT_REQUEST_URL = 'https://jsonplaceholder.typicode.com/posts/1'
export const DEFAULT_REQUEST_BODY = `{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "developer"
}`
export const DEFAULT_HEADERS = [{ enabled: true, key: 'Content-Type', value: 'application/json' }]
export const DEFAULT_AUTHORIZATION = {
  type: 'None',
  bearerToken: '',
  username: '',
  password: '',
  apiKey: '',
  apiValue: '',
  apiKeyLocation: 'Header',
}
export const SIDEBAR_WIDTH = { default: 280, minimum: 220, maximum: 450 }
export const PANE_HEIGHT = { requestMinimum: 220, responseMinimum: 180, requestMaximumRatio: 0.8 }

export const DEFAULT_ENVIRONMENTS = [
  {
    id: 'env-default',
    name: 'DEV',
    active: true,
    variables: [
      {
        id: 'var-base-url',
        key: 'baseUrl',
        value: 'https://jsonplaceholder.typicode.com',
        enabled: true,
      },
    ],
  },
  {
    id: 'env-sit',
    name: 'SIT',
    active: false,
    variables: [],
  },
  {
    id: 'env-uat',
    name: 'UAT',
    active: false,
    variables: [],
  },
  {
    id: 'env-prod',
    name: 'PROD',
    active: false,
    variables: [],
  },
]

export const DEFAULT_ENVIRONMENT_IDS = DEFAULT_ENVIRONMENTS.map((environment) => environment.id)
