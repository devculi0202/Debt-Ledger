import { endOfMonth, parseIsoDate } from '../dates.js'

/**
 * Infer due date from Vietnamese natural-language phrases.
 * @param {string} text
 * @param {Date} [reference]
 * @returns {string|null} YYYY-MM-DD
 */
export function inferDueDateFromText(text, reference = new Date()) {
  if (/th[aá]ng\s+(?:sau|t[iớ]i|toi)\b/i.test(text)) {
    let month = reference.getMonth() + 2
    let year = reference.getFullYear()
    if (month > 12) {
      month -= 12
      year += 1
    }
    return endOfMonth(year, month)
  }

  if (/th[aá]ng\s+n[aà]y\b/i.test(text)) {
    return endOfMonth(reference.getFullYear(), reference.getMonth() + 1)
  }

  const dayMonth = text.match(
    /(?:ngày\s*)?(\d{1,2})\s*th[aá]ng\s*(\d{1,2})\b/i,
  )
  if (dayMonth) {
    const day = parseInt(dayMonth[1], 10)
    const month = parseInt(dayMonth[2], 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let year = reference.getFullYear()
      const nowMonth = reference.getMonth() + 1
      const nowDay = reference.getDate()
      if (month < nowMonth || (month === nowMonth && day < nowDay)) {
        year += 1
      }
      const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return parseIsoDate(candidate)
    }
  }

  const monthOnly = text.match(/th[aá]ng\s*(\d{1,2})\b(?:\s*tr[aả])?/i)
  if (!monthOnly) return null

  const month = parseInt(monthOnly[1], 10)
  if (month < 1 || month > 12) return null

  let year = reference.getFullYear()
  if (month < reference.getMonth() + 1) year += 1

  return endOfMonth(year, month)
}
