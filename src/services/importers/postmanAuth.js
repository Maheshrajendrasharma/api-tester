export function normalizeAuthorization(auth) {

  if (!auth || typeof auth !== 'object') {
    return {
      type: 'None',
      bearerToken: '',
      username: '',
      password: '',
      apiKey: '',
      apiValue: '',
      apiKeyLocation: 'Header',
    }
  }

  if (auth.type === 'bearer') {
    return {
      type: 'Bearer Token',
      bearerToken: auth.token || auth.bearerToken || '',
      username: '',
      password: '',
      apiKey: '',
      apiValue: '',
      apiKeyLocation: 'Header',
    }
  }

  if (auth.type === 'basic') {
    return {
      type: 'Basic Auth',
      bearerToken: '',
      username: auth.username || '',
      password: auth.password || '',
      apiKey: '',
      apiValue: '',
      apiKeyLocation: 'Header',
    }
  }

  if (auth.type === 'apikey') {
    return {
      type: 'API Key',
      bearerToken: '',
      username: '',
      password: '',
      apiKey: auth.key || '',
      apiValue: auth.value || '',
      apiKeyLocation: auth.in === 'query'
        ? 'Query Parameter'
        : 'Header',
    }
  }

  return {
    type: 'None',
    bearerToken: '',
    username: '',
    password: '',
    apiKey: '',
    apiValue: '',
    apiKeyLocation: 'Header',
  }

}