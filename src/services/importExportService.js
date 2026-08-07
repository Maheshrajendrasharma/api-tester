import {
  normalizeCollectionData,
  normalizeEnvironmentData,
  serializeCollectionForExport,
  serializeEnvironmentForExport,
} from './collectionService'

import { importPostmanCollection } from './importers/postmanImporter'


export async function readJsonFile(file) {
  if (!file) {
    throw new Error('No file provided.')
  }

  const text = await file.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON. Please select a valid JSON file.')
  }
}


/*
 * Import a collection.
 *
 * Supports:
 *
 * 1. Postman collection
 * 2. API Tester collection
 *
 * Postman collections are converted into the
 * new hierarchical collection tree without
 * flattening folders.
 */
export async function importCollectionFromFile(file) {
  const parsed = await readJsonFile(file)

  // -----------------------------------------
  // Postman Collection
  // -----------------------------------------

  if (
    parsed?.info &&
    Array.isArray(parsed?.item)
  ) {
    return importPostmanCollection(parsed)
  }


  // -----------------------------------------
  // API Tester Collection
  // -----------------------------------------

  return normalizeCollectionData(parsed)
}


/*
 * Import environment JSON.
 */
export async function importEnvironmentFromFile(file) {
  const parsed = await readJsonFile(file)

  return normalizeEnvironmentData(parsed)
}


/*
 * Export collection.
 */
export async function exportCollection(collection) {
  if (!collection) {
    throw new Error('Collection is missing.')
  }

  return serializeCollectionForExport(collection)
}


/*
 * Export environment.
 */
export async function exportEnvironment(environment) {
  if (!environment) {
    throw new Error('Environment is missing.')
  }

  return serializeEnvironmentForExport(environment)
}