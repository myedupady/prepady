/**
 * Minimal RFC-4180 CSV parser (no dependency). Handles quoted fields containing
 * commas, newlines, and escaped quotes (""). Pure and unit-tested.
 */

/** Parse CSV text into a matrix of string cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  // Normalise BOM.
  const s = text.replace(/^﻿/, '')

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      // End of record; swallow the \n in a \r\n pair.
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  // Flush the final field/row if there is trailing content.
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/**
 * Parse CSV into objects keyed by the (lower-cased, trimmed) header row.
 * Blank rows are skipped.
 */
export function csvToObjects(text: string): Record<string, string>[] {
  const matrix = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''))
  if (matrix.length === 0) return []
  const headers = matrix[0].map((h) => h.trim().toLowerCase())
  return matrix.slice(1).map((cells) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? '').trim()
    })
    return obj
  })
}
