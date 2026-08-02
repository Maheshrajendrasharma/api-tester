import { normalizeCollectionData, normalizeEnvironmentData, serializeCollectionForExport, serializeEnvironmentForExport } from './collectionService'

export async function readJsonFile(file) {
  if (!file) throw new Error('No file provided.')

  const text = await file.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON. Please select a valid JSON file.')
  }
}

export async function importCollectionFromFile(file) {
  const parsed = await readJsonFile(file)
  return normalizeCollectionData(parsed)
}

export async function importEnvironmentFromFile(file) {
  const parsed = await readJsonFile(file)
  return normalizeEnvironmentData(parsed)
}

export async function exportCollection(collection) {
  if (!collection) throw new Error('Collection is missing.')
  return serializeCollectionForExport(collection)
}

export async function exportEnvironment(environment) {
  if (!environment) throw new Error('Environment is missing.')
  return serializeEnvironmentForExport(environment)
}
