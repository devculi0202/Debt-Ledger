function pad2(n) {
  return String(n).padStart(2, '0')
}

export function getSourceYear(debt) {
  const dateStr = debt.transaction_date || debt.created_at?.split('T')[0]
  if (dateStr) return parseInt(dateStr.split('-')[0], 10)
  return new Date().getFullYear()
}

export function getSourceMonthNumber(debt) {
  const notes = debt.notes || ''
  const tMatch = notes.match(/\bT(\d{1,2})\b/i)
  if (tMatch) {
    const m = parseInt(tMatch[1], 10)
    if (m >= 1 && m <= 12) return m
  }
  const dateStr = debt.transaction_date || debt.created_at?.split('T')[0]
  if (dateStr) return parseInt(dateStr.split('-')[1], 10)
  return new Date().getMonth() + 1
}

export function endOfMonth(year, month1to12) {
  const lastDay = new Date(year, month1to12, 0).getDate()
  return `${year}-${pad2(month1to12)}-${pad2(lastDay)}`
}

export function shiftTxDate(sourceDateStr, targetMonth1to12, year) {
  const parts = sourceDateStr.split('-')
  const day = parseInt(parts[2], 10) || 1
  const lastDay = new Date(year, targetMonth1to12, 0).getDate()
  const actualDay = Math.min(day, lastDay)
  return `${year}-${pad2(targetMonth1to12)}-${pad2(actualDay)}`
}

export function replaceMonthInNotes(notes, targetMonth) {
  const text = notes || ''
  if (/\bT\d{1,2}\b/i.test(text)) {
    return text.replace(/\bT\d{1,2}\b/i, `T${targetMonth}`)
  }
  return text ? `${text} T${targetMonth}` : `T${targetMonth}`
}

export function buildDuplicatePayload(sourceDebt, targetMonth) {
  const year = getSourceYear(sourceDebt)
  const sourceDate =
    sourceDebt.transaction_date || sourceDebt.created_at?.split('T')[0]

  return {
    type: sourceDebt.type,
    person: sourceDebt.person,
    amount: Number(sourceDebt.amount),
    account_id: sourceDebt.account_id ?? null,
    transaction_date: shiftTxDate(sourceDate, targetMonth, year),
    due_date: endOfMonth(year, targetMonth),
    notes: replaceMonthInNotes(sourceDebt.notes, targetMonth),
    paid: false,
  }
}

export function buildDuplicatePayloads(sourceDebt, targetMonths) {
  return [...targetMonths]
    .sort((a, b) => a - b)
    .map((month) => ({
      month,
      payload: buildDuplicatePayload(sourceDebt, month),
    }))
}

export function findMonthConflicts(existingDebts, sourceDebt, targetMonths) {
  const accountId = sourceDebt.account_id
  if (!accountId) return []

  return targetMonths.filter((month) => {
    const pattern = new RegExp(`\\bT${month}\\b`, 'i')
    return existingDebts.some((d) => {
      if (d.id === sourceDebt.id) return false
      if (String(d.account_id) !== String(accountId)) return false
      return pattern.test(d.notes || '')
    })
  })
}
