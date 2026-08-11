import { API_KEY_LOCATIONS, AUTH_TYPES } from '../utils/constants'

function AuthorizationEditor({
  environment,
  authorization,
  onChange
}) {
  function updateAuthorization(field, value) {
    onChange({
      ...authorization,
      [field]: value
    })
  }

  return (
    <div className="authorization-editor">

      {/* =====================================================
          LEFT SIDE - AUTHORIZATION TYPE
          ===================================================== */}

      <div className="authorization-type-section">

        <label
          className="authorization-label"
          htmlFor="authorization-type"
        >
          Authorization Type
        </label>

        <select
          className="authorization-select"
          id="authorization-type"
          value={authorization.type}
          onChange={(event) =>
            updateAuthorization(
              'type',
              event.target.value
            )
          }
        >
          {AUTH_TYPES.map((type) => (
            <option
              key={type}
              value={type}
            >
              {type}
            </option>
          ))}
        </select>

      </div>


      {/* =====================================================
          RIGHT SIDE - GENERATED AUTHORIZATION FIELDS
          ===================================================== */}

      <div className="authorization-content">

        {/* NONE */}

        {authorization.type === 'None' && (
          <p className="authorization-note">
            No authorization will be added to this request.
          </p>
        )}


        {/* ===================================================
            BEARER TOKEN
            =================================================== */}

        {authorization.type === 'Bearer Token' && (
          <div className="authorization-fields">

            <label
              className="authorization-label"
              htmlFor="bearer-token"
            >
              Token
            </label>

            <input
              className="authorization-input"
              id="bearer-token"
              type="password"
              value={authorization.bearerToken}
              onChange={(event) =>
                updateAuthorization(
                  'bearerToken',
                  event.target.value
                )
              }
              placeholder="Enter Bearer Token"
            />

            <p className="authorization-hint">
              Example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
            </p>

          </div>
        )}


        {/* ===================================================
            BASIC AUTH
            =================================================== */}

        {authorization.type === 'Basic Auth' && (
          <div className="authorization-fields">

            <label
              className="authorization-label"
              htmlFor="basic-username"
            >
              Username
            </label>

            <input
              className="authorization-input"
              id="basic-username"
              value={authorization.username}
              onChange={(event) =>
                updateAuthorization(
                  'username',
                  event.target.value
                )
              }
              placeholder="Enter username"
            />

            <label
              className="authorization-label"
              htmlFor="basic-password"
            >
              Password
            </label>

            <input
              className="authorization-input"
              id="basic-password"
              type="password"
              value={authorization.password}
              onChange={(event) =>
                updateAuthorization(
                  'password',
                  event.target.value
                )
              }
              placeholder="Enter password"
            />

          </div>
        )}


        {/* ===================================================
            API KEY
            =================================================== */}

        {authorization.type === 'API Key' && (
          <div className="authorization-fields">

            <label
              className="authorization-label"
              htmlFor="api-key-name"
            >
            </label>

            <input
              className="authorization-input"
              id="api-key-name"
              value={authorization.apiKey}
              onChange={(event) =>
                updateAuthorization(
                  'apiKey',
                  event.target.value
                )
              }
              placeholder="Enter key"
            />


            <label
              className="authorization-label"
              htmlFor="api-key-value"
            >
            </label>

            <input
              className="authorization-input"
              id="api-key-value"
              value={authorization.apiValue}
              onChange={(event) =>
                updateAuthorization(
                  'apiValue',
                  event.target.value
                )
              }
              placeholder="Enter value"
            />


            <label
              className="authorization-label"
              htmlFor="api-key-location"
            >

            </label>

            <select
              className="authorization-select"
              id="api-key-location"
              value={authorization.apiKeyLocation}
              onChange={(event) =>
                updateAuthorization(
                  'apiKeyLocation',
                  event.target.value
                )
              }
            >
              {API_KEY_LOCATIONS.map((location) => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}
            </select>

          </div>
        )}

      </div>

    </div>
  )
}

export default AuthorizationEditor