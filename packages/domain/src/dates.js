export function pad2(n) {
  return String(n).padStart(2, '0')
}

/** Last calendar day of month as YYYY-MM-DD. month is 1–12. */
export function endOfMonth(year, month1to12) {
  const lastDay = new Date(year, month1to12, 0).getDate()
  return `${year}-${pad2(month1to12)}-${pad2(lastDay)}`
}

/** @returns {string|null} YYYY-MM-DD or null if invalid */
export function parseIsoDate(value) {
  if (value == null || value === '') return null
  const s = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }
  return s
}

export function todayIsoDate(reference = new Date()) {
  return reference.toISOString().split('T')[0]
}
