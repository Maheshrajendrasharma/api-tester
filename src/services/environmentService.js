import {
  DEFAULT_ENVIRONMENTS,
} from '../utils/constants'

import {
  clone,
  generateId,
} from '../utils/environmentHelpers'


const STORAGE_KEY = 'apiTester.environments'


/*
=======================================================
VARIABLE
=======================================================
*/

export function createVariableDraft() {
  return {
    id: generateId('var'),
    key: '',
    value: '',
    enabled: true,
  }
}


/*
=======================================================
ENVIRONMENT NORMALIZATION
=======================================================
*/

function normalizeEnvironments(environments) {

  const savedEnvironments =
    Array.isArray(environments)
      ? environments
      : []


  const savedById =
    new Map(
      savedEnvironments.map(
        (environment) => [
          environment.id,
          environment
        ]
      )
    )


  const merged =
    DEFAULT_ENVIRONMENTS.map(
      (environment) => (

        savedById.has(environment.id)
          ? savedById.get(environment.id)
          : clone(environment)

      )
    )


  const customEnvironments =
    savedEnvironments.filter(
      (environment) =>
        !DEFAULT_ENVIRONMENTS.some(
          (defaultEnvironment) =>
            defaultEnvironment.id === environment.id
        )
    )


  const environmentsWithDefaults = [
    ...merged,
    ...customEnvironments,
  ]


  const activeEnvironment =
    environmentsWithDefaults.find(
      (environment) =>
        environment.active
    )


  return environmentsWithDefaults.map(
    (environment, index) => ({

      ...environment,

      active:
        activeEnvironment
          ? environment.id === activeEnvironment.id
          : index === 0,

      variables:
        Array.isArray(environment.variables) &&
        environment.variables.length > 0
          ? environment.variables
          : [createVariableDraft()],

    })
  )
}


/*
=======================================================
LEGACY STORAGE FUNCTIONS
=======================================================

These are kept so we don't accidentally break any
existing functionality that may still use them.

Workspace-based code should NOT use these for the
active workspace.
=======================================================
*/

export function loadEnvironments() {

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    )


  if (!raw) {

    return clone(
      DEFAULT_ENVIRONMENTS
    )

  }


  try {

    const environments =
      normalizeEnvironments(
        JSON.parse(raw)
      )


    return clone(
      environments
    )

  } catch {

    return clone(
      DEFAULT_ENVIRONMENTS
    )

  }

}


export function saveEnvironments(
  environments
) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(environments)
  )

}


/*
=======================================================
CREATE ENVIRONMENT
=======================================================
*/

export function createEnvironmentDraft(
  name = ''
) {

  return {

    id:
      generateId('env'),

    name:
      String(name).trim(),

    active:
      false,

    variables: [
      createVariableDraft()
    ],

  }

}


/*
=======================================================
SET ACTIVE ENVIRONMENT
=======================================================

IMPORTANT:

This function now works with the environments array
provided by App.jsx.

It DOES NOT load from localStorage.

That is required for workspace isolation.
=======================================================
*/

export function setActiveEnvironment(
  environments,
  environmentId
) {

  const safeEnvironments =
    Array.isArray(environments)
      ? environments
      : []


  if (
    !safeEnvironments.some(
      (environment) =>
        environment.id === environmentId
    )
  ) {

    return safeEnvironments

  }


  return safeEnvironments.map(
    (environment) => ({

      ...environment,

      active:
        environment.id === environmentId,

    })
  )

}


/*
=======================================================
GET ACTIVE ENVIRONMENT

Legacy helper.

Workspace code should preferably determine the
active environment from its own environments array.
=======================================================
*/

export function getActiveEnvironment() {

  return (
    loadEnvironments().find(
      (environment) =>
        environment.active
    )
    ?? null
  )

}


/*
=======================================================
CREATE ENVIRONMENT

Legacy storage helper.

Existing functionality is preserved.
=======================================================
*/

export function createEnvironment(
  name
) {

  const environments =
    loadEnvironments()


  const newEnvironment =
    createEnvironmentDraft(name)


  const updated = [
    ...environments,
    newEnvironment,
  ]


  saveEnvironments(
    updated
  )


  return newEnvironment

}


/*
=======================================================
RENAME ENVIRONMENT
=======================================================

NEW WORKSPACE-SAFE SIGNATURE:

renameEnvironment(
    environments,
    environmentId,
    newName
)
=======================================================
*/

export function renameEnvironment(
  environments,
  environmentId,
  newName
) {

  const safeEnvironments =
    Array.isArray(environments)
      ? environments
      : []


  return safeEnvironments.map(
    (environment) => (

      environment.id === environmentId

        ? {
            ...environment,

            name:
              String(newName).trim(),
          }

        : environment

    )
  )

}


/*
=======================================================
DELETE ENVIRONMENT
=======================================================

NEW WORKSPACE-SAFE SIGNATURE:

deleteEnvironment(
    environments,
    environmentId
)
=======================================================
*/

export function deleteEnvironment(
  environments,
  environmentId
) {

  const safeEnvironments =
    Array.isArray(environments)
      ? environments
      : []


  /*
  Do not allow the last environment
  to be deleted.
  */

  if (
    safeEnvironments.length <= 1
  ) {

    return safeEnvironments

  }


  const deletingIndex =
    safeEnvironments.findIndex(
      (environment) =>
        environment.id === environmentId
    )


  if (
    deletingIndex === -1
  ) {

    return safeEnvironments

  }


  let updated =
    safeEnvironments.filter(
      (environment) =>
        environment.id !== environmentId
    )


  let nextIndex =
    deletingIndex - 1


  if (nextIndex < 0) {
    nextIndex = 0
  }


  updated =
    updated.map(
      (environment, index) => ({

        ...environment,

        active:
          index === nextIndex,

      })
    )


  return updated

}


/*
=======================================================
GENERATE UNIQUE COPY NAME
=======================================================
*/

function generateUniqueName(
  baseName,
  existingNames
) {

  let cleanBase =
    String(baseName ?? '')


  /*
  Remove ALL trailing:

  Copy
  Copy 1
  Copy 2
  Copy 3
  etc.
  */

  while (true) {

    const next =
      cleanBase.replace(
        /\sCopy(?:\s\d+)?$/,
        ''
      )


    if (
      next === cleanBase
    ) {

      break

    }


    cleanBase = next

  }


  const firstCopy =
    `${cleanBase} Copy`


  if (
    !existingNames.includes(
      firstCopy
    )
  ) {

    return firstCopy

  }


  let counter = 1


  while (
    existingNames.includes(
      `${cleanBase} Copy ${counter}`
    )
  ) {

    counter++

  }


  return `${cleanBase} Copy ${counter}`

}


/*
=======================================================
DUPLICATE ENVIRONMENT
=======================================================

NEW WORKSPACE-SAFE SIGNATURE:

duplicateEnvironment(
    environments,
    environmentId
)
=======================================================
*/

export function duplicateEnvironment(
  environments,
  environmentId
) {

  const safeEnvironments =
    Array.isArray(environments)
      ? environments
      : []


  const source =
    safeEnvironments.find(
      (environment) =>
        environment.id === environmentId
    )


  if (!source) {

    return safeEnvironments

  }


  const duplicated = {

    ...clone(source),

    id:
      generateId('env'),

    name:
      generateUniqueName(
        source.name,
        safeEnvironments.map(
          (environment) =>
            environment.name
        )
      ),

    active:
      true,

    variables:
      Array.isArray(source.variables)
        ? source.variables.map(
            (variable) => ({

              ...clone(variable),

              id:
                generateId('var'),

            })
          )
        : [
            createVariableDraft()
          ],

  }


  return [

    ...safeEnvironments.map(
      (environment) => ({

        ...environment,

        active:
          false,

      })
    ),

    duplicated,

  ]

}