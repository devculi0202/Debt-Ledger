const STATUS_TO_URL = {
  all: 'all',
  active: 'activeOnly',
  settled: 'settledOnly',
}

const STATUS_FROM_URL = {
  all: 'all',
  activeOnly: 'active',
  settledOnly: 'settled',
}

const TIME_ALL = 'alltime'
const MONTH_RE = /^\d{4}-\d{2}$/

/**
 * @param {URLSearchParams} searchParams
 * @returns {{ accountId: string|null, time: string, status: string, q: string }}
 *   time/status are UI values: time 'all'|'YYYY-MM', status 'all'|'active'|'settled'
 */
export function parseTransactionFilters(searchParams) {
  const rawAccountId = searchParams.get('accountId')
  const accountId =
    rawAccountId && rawAccountId.trim() !== '' ? rawAccountId.trim() : null

  const rawTime = searchParams.get('time')
  let time = 'all'
  if (rawTime && rawTime !== TIME_ALL) {
    time = MONTH_RE.test(rawTime) ? rawTime : 'all'
  }

  const rawStatus = searchParams.get('status')
  const status =
    rawStatus && STATUS_FROM_URL[rawStatus] !== undefined
      ? STATUS_FROM_URL[rawStatus]
      : 'all'

  const q = searchParams.get('q') ?? ''

  return { accountId, time, status, q }
}

/**
 * @param {{ accountId?: string|null, time?: string, status?: string, q?: string }} filters
 *   UI values for time/status
 * @param {{ explicitDefaults?: boolean }} [options]
 * @returns {URLSearchParams}
 */
export function buildTransactionSearchParams(filters, options = {}) {
  const { explicitDefaults = false } = options
  const params = new URLSearchParams()

  const accountId = filters.accountId
  if (accountId) {
    params.set('accountId', String(accountId))
  }

  const time = filters.time ?? 'all'
  const timeUrl = time === 'all' ? TIME_ALL : time
  if (explicitDefaults || timeUrl !== TIME_ALL) {
    params.set('time', timeUrl)
  }

  const status = filters.status ?? 'all'
  const statusUrl = STATUS_TO_URL[status] ?? 'all'
  if (explicitDefaults || statusUrl !== 'all') {
    params.set('status', statusUrl)
  }

  const q = filters.q ?? ''
  if (q !== '') {
    params.set('q', q)
  }

  return params
}

/**
 * View Ledger target path with explicit trio (spec).
 * @param {string|number} accountId
 * @returns {string}
 */
export function viewLedgerPath(accountId) {
  const params = new URLSearchParams({
    accountId: String(accountId),
    time: TIME_ALL,
    status: 'settledOnly',
  })
  return `/transactions?${params.toString()}`
}
