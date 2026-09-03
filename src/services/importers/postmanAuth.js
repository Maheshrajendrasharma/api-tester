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


  /*
   * ---------------------------------------------------------
   * BEARER TOKEN
   * ---------------------------------------------------------
   */

  if (auth.type === 'bearer') {

    return {

      type: 'Bearer Token',

      bearerToken:
        auth.token ??
        auth.bearerToken ??
        '',

      username: '',

      password: '',

      apiKey: '',

      apiValue: '',

      apiKeyLocation: 'Header',

    }

  }


  /*
   * ---------------------------------------------------------
   * BASIC AUTH
   * ---------------------------------------------------------
   */

  if (auth.type === 'basic') {

    return {

      type: 'Basic Auth',

      bearerToken: '',

      username:
        auth.username ??
        '',

      password:
        auth.password ??
        '',

      apiKey: '',

      apiValue: '',

      apiKeyLocation: 'Header',

    }

  }


  /*
   * ---------------------------------------------------------
   * API KEY
   *
   * Postman stores this as:
   *
   * auth: {
   *   type: "apikey",
   *   apikey: [
   *     {
   *       key: "key",
   *       value: "{{apikey}}"
   *     },
   *     {
   *       key: "value",
   *       value: "{{apikey_value}}"
   *     },
   *     {
   *       key: "in",
   *       value: "header"
   *     }
   *   ]
   * }
   *
   * ---------------------------------------------------------
   */

  if (auth.type === 'apikey') {

    const apiKeyEntries =
      Array.isArray(auth.apikey)
        ? auth.apikey
        : []


    let apiKey = ''

    let apiValue = ''

    let apiLocation = 'header'


    for (
      const entry
      of apiKeyEntries
    ) {

      if (!entry) {
        continue
      }


      const key =
        String(
          entry.key ??
          ''
        ).toLowerCase()


      const value =
        entry.value ??
        ''


      if (key === 'key') {

        apiKey = value

      }


      if (key === 'value') {

        apiValue = value

      }


      if (
        key === 'in'
      ) {

        apiLocation =
          String(
            value
          ).toLowerCase()

      }

    }


    /*
     * Also support the simpler object form.
     * This keeps API Tester imports backward compatible.
     */

    if (
      !apiKey &&
      auth.key != null
    ) {

      apiKey =
        auth.key

    }


    if (
      !apiValue &&
      auth.value != null
    ) {

      apiValue =
        auth.value

    }


    if (
      auth.in != null
    ) {

      apiLocation =
        String(
          auth.in
        ).toLowerCase()

    }


    return {

      type: 'API Key',

      bearerToken: '',

      username: '',

      password: '',

      apiKey,

      apiValue,

      apiKeyLocation:
        apiLocation === 'query'
          ? 'Query Parameter'
          : 'Header',

    }

  }


  /*
   * ---------------------------------------------------------
   * UNKNOWN / NONE
   * ---------------------------------------------------------
   */

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