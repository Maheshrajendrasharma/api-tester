import { importCollectionFromFile } from './src/services/importExportService.js'

const payload = {
  info: { name: 'Postman Test Collection' },
  item: [{ name: 'Sample Request', request: { method: 'GET', url: 'https://example.com' } }],
}

const file = new File([JSON.stringify(payload)], 'postman-collection.json', { type: 'application/json' })
const result = await importCollectionFromFile(file)
console.log(JSON.stringify({ name: result.name, requestCount: result.requests.length, firstRequestName: result.requests[0]?.name }, null, 2))
