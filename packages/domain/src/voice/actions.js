export const VALID_ACTIONS = new Set(['lent', 'borrowed', 'repaid'])

/**
 * Map voice/NLP action to ledger transaction type.
 * @param {string} action
 * @returns {'owed'|'owe'}
 */
export function mapActionToType(action) {
  if (action === 'lent') return 'owed'
  return 'owe'
}
