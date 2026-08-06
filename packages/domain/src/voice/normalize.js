import { parseIsoDate } from '../dates.js'
import { VALID_ACTIONS } from './actions.js'
import { normalizeVndAmount } from './amounts.js'
import { inferDueDateFromText } from './dueDate.js'

/**
 * Normalize raw LLM JSON into a validated extraction object.
 */
export function normalizeExtracted(data, sourceText = '') {
  const person_name = String(data?.person_name ?? '').trim()
  const amount = normalizeVndAmount(Number(data?.amount), sourceText)
  const currency = String(data?.currency ?? 'VND').trim() || 'VND'
  const action = String(data?.action ?? '').trim().toLowerCase()
  const reason = String(data?.reason ?? '').trim()

  let due_date = sourceText ? inferDueDateFromText(sourceText) : null
  if (!due_date) {
    due_date = parseIsoDate(data?.due_date)
  }

  if (!person_name) {
    throw new Error('Could not identify a person name from the input.')
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Could not identify a valid amount from the input.')
  }
  if (!VALID_ACTIONS.has(action)) {
    throw new Error(
      `Invalid action "${action}". Expected lent, borrowed, or repaid.`,
    )
  }

  return {
    person_name,
    amount,
    currency,
    action,
    reason,
    due_date,
  }
}
