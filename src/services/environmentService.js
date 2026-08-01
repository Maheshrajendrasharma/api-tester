import {
  DEFAULT_ENVIRONMENTS,
} from '../utils/constants'

import {
  clone,
  generateId,
} from '../utils/environmentHelpers'

const STORAGE_KEY = 'apiTester.environments'

export function loadEnvironments() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    saveEnvironments(DEFAULT_ENVIRONMENTS)
    return clone(DEFAULT_ENVIRONMENTS)
  }

  try {
    return JSON.parse(raw)
  } catch {
    saveEnvironments(DEFAULT_ENVIRONMENTS)
    return clone(DEFAULT_ENVIRONMENTS)
  }
}

export function saveEnvironments(environments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(environments))
}