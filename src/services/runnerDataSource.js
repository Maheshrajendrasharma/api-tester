function normalizeHeader(value) {
  return String(value ?? '').trim()
}

function normalizeRows(rows) {
  return (rows ?? []).map((row) => {
    const normalized = {}
    Object.entries(row ?? {}).forEach(([key, value]) => {
      normalized[normalizeHeader(key)] = value == null ? '' : value
    })
    return normalized
  })
}

export function rowsFromManualVariable(variable, values) {
  return (values ?? []).map((value) => ({
    [variable]: value,
  }))
}

export async function parseRunnerDataFile(file) {
  if (!file) throw new Error('No data file selected.')

  const name = String(file.name ?? '').toLowerCase()
  const extension = name.split('.').pop()

  if (extension === 'csv') {
    const text = await file.text()
    const lines = text
      .split(/\r?\n/)
      .filter((line) => line.trim() !== '')

    if (!lines.length) return []

    const headers = lines[0].split(',').map(normalizeHeader)

    return normalizeRows(
      lines.slice(1).map((line) => {
        const values = line.split(',')
        return headers.reduce((row, header, index) => {
          row[header] = values[index] ?? ''
          return row
        }, {})
      })
    )
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return []

    const sheet = workbook.Sheets[sheetName]
    return normalizeRows(
      XLSX.utils.sheet_to_json(sheet, { defval: '' })
    )
  }

  throw new Error('Supported runner data files are CSV, XLS and XLSX.')
}

export function buildIterationRows({
  mode = 'none',
  rows = [],
  variable = '',
  values = [],
}) {
  if (mode === 'file') return normalizeRows(rows)
  if (mode === 'manual') return rowsFromManualVariable(variable, values)
  return [{}]
}
