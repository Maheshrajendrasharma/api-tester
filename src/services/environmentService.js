import {
  DEFAULT_ENVIRONMENTS,
} from '../utils/constants'

import {
  clone,
  generateId,
} from '../utils/environmentHelpers'

const STORAGE_KEY = 'apiTester.environments'

function normalizeEnvironments(environments) {
  const savedEnvironments = Array.isArray(environments) ? environments : []
  const savedById = new Map(savedEnvironments.map((environment) => [environment.id, environment]))
  const merged = DEFAULT_ENVIRONMENTS.map((environment) => (
    savedById.has(environment.id) ? savedById.get(environment.id) : clone(environment)
  ))
  const customEnvironments = savedEnvironments.filter((environment) => !DEFAULT_ENVIRONMENTS.some((defaultEnvironment) => defaultEnvironment.id === environment.id))
  const environmentsWithDefaults = [...merged, ...customEnvironments]
  const activeEnvironment = environmentsWithDefaults.find((environment) => environment.active)

  return environmentsWithDefaults.map((environment, index) => ({
    ...environment,
    active: activeEnvironment ? environment.id === activeEnvironment.id : index === 0,
    variables:
    Array.isArray(environment.variables) &&
    environment.variables.length > 0
        ? environment.variables
        : [createVariableDraft()],
  }))
}

export function loadEnvironments() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return clone(DEFAULT_ENVIRONMENTS)
  }

  try {
    const environments = normalizeEnvironments(JSON.parse(raw))
    return clone(environments)
  } catch {
    return clone(DEFAULT_ENVIRONMENTS)
  }
}

export function saveEnvironments(environments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(environments))
}

export function createEnvironmentDraft(name) {
  return {
    id: generateId('env'),
    name: name.trim(),
    active: false,
    variables: [
    createVariableDraft(),
],
  }
}

export function createVariableDraft() {
  return {
    id: generateId('var'),
    key: '',
    value: '',
    enabled: true,
  }
}

export function setActiveEnvironment(id) {
  const environments = loadEnvironments()

  if (!environments.some((environment) => environment.id === id)) return environments

  const updated = environments.map((environment) => ({
    ...environment,
    active: environment.id === id,
  }))

  saveEnvironments(updated)
  return updated
}

export function getActiveEnvironment() {
  return loadEnvironments().find((environment) => environment.active) ?? null
}

export function createEnvironment(name) {
  const environments = loadEnvironments()
  const newEnvironment = createEnvironmentDraft(name)

  const updated = [...environments, newEnvironment]

  saveEnvironments(updated)

  return newEnvironment
}

export function renameEnvironment(id, newName) {

    const environments = loadEnvironments()

    const updated = environments.map(environment =>

        environment.id === id
            ? {
                ...environment,
                name: newName.trim(),
            }
            : environment

    )

    saveEnvironments(updated)

    return updated

}


export function deleteEnvironment(id) {

    const environments = loadEnvironments()

    const deletingIndex = environments.findIndex(
        environment => environment.id === id
    )

    if (deletingIndex === -1)
        return environments

    if (environments.length === 1)
        return environments

    let updated = environments.filter(
        environment => environment.id !== id
    )

    let nextIndex = deletingIndex - 1

    if (nextIndex < 0)
        nextIndex = 0

    updated = updated.map((environment,index)=>({

        ...environment,

        active:index===nextIndex

    }))

    saveEnvironments(updated)

    return updated

}

export function duplicateEnvironment(id) {
  const environments = loadEnvironments()

  const source = environments.find(
    (environment) => environment.id === id,
  )

  if (!source) {
    return environments
  }

  const duplicated = {
    ...clone(source),
    id: generateId('env'),
    name: `${source.name} Copy`,
    active: false,
    variables: source.variables.map((variable) => ({
      ...clone(variable),
      id: generateId('var'),
    })),
  }

const updated = environments.map(environment => ({
    ...environment,
    active: false,
}))

duplicated.active = true

updated.push(duplicated)

saveEnvironments(updated)

return updated


}
