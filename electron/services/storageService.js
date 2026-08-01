import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function getCollectionsFilePath() {
  return path.join(app.getPath('userData'), 'collections.json')
}

export async function load() {
  try {
    const fileContents = await readFile(getCollectionsFilePath(), 'utf8')
    const data = JSON.parse(fileContents)
    return Array.isArray(data.collections) ? data.collections : []
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return []
    throw error
  }
}

export async function save(collections) {
  const collectionsFilePath = getCollectionsFilePath()
  await mkdir(path.dirname(collectionsFilePath), { recursive: true })
  await writeFile(collectionsFilePath, JSON.stringify({ collections }, null, 2), 'utf8')
}
