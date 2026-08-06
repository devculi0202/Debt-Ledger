import { todayIsoDate, parseIsoDate } from '../dates.js'
import { mapActionToType } from './actions.js'

/**
 * Convert validated extraction → debts table payload.
 */
export function toTransactionPayload(extracted, reference = new Date()) {
  const paid = extracted.action === 'repaid'

  return {
    type: mapActionToType(extracted.action),
    person: extracted.person_name,
    amount: Math.round(extracted.amount),
    transaction_date: todayIsoDate(reference),
    due_date: extracted.due_date ?? null,
    notes: extracted.reason || '',
    account_id: null,
    paid,
  }
}

/**
 * Map /api/debt response (or legacy extraction shape) to a debts row payload.
 */
export function mapVoiceDebtToTransaction(response, reference = new Date()) {
  const data = response?.data ?? response

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid voice debt response.')
  }

  // Ledger-ready shape from API
  if (data.person != null && data.type != null && data.amount != null) {
    return {
      type: data.type,
      person: String(data.person).trim(),
      amount: Math.round(Number(data.amount)),
      transaction_date: data.transaction_date || todayIsoDate(reference),
      due_date: data.due_date ?? null,
      notes: data.notes != null ? String(data.notes) : '',
      account_id: data.account_id ?? null,
      paid: Boolean(data.paid),
    }
  }

  // Legacy extraction shape (person_name, action, reason, due_date)
  const person = String(data.person_name ?? data.person ?? '').trim()
  const amount = Math.round(Number(data.amount))
  const action = String(data.action ?? '').trim().toLowerCase()
  const due_date =
    data.due_date != null ? parseIsoDate(data.due_date) : null

  if (!person) throw new Error('Could not identify a person from the response.')
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Could not identify a valid amount from the response.')
  }

  return {
    type: mapActionToType(action),
    person,
    amount,
    transaction_date: todayIsoDate(reference),
    due_date,
    notes:
      data.reason != null
        ? String(data.reason)
        : data.notes != null
          ? String(data.notes)
          : '',
    account_id: null,
    paid: action === 'repaid',
  }
}
