# Transaction URL Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/transactions` filters URL-driven so View Ledger opens `?accountId=…&time=alltime&status=settledOnly`, filters by exact account id, and stays in sync when controls change.

**Architecture:** Pure helpers in `src/lib/transactionFilters.js` map between URL search params and UI filter values. `TransactionLedger` owns `useSearchParams`, applies filters (including `accountId`), and shows a clearable account hint. `App.jsx` drops filter React state and only navigates with the View Ledger query string.

**Tech Stack:** React 19, Vite 8, `react-router-dom` (`useSearchParams`, `navigate`), existing `isSettled` helper.

**Spec:** `docs/superpowers/specs/2026-07-29-transaction-url-filters-design.md`

## Global Constraints

- URL params: `accountId`, `time` (`alltime` | `YYYY-MM`), `status` (`all` | `activeOnly` | `settledOnly`), `q`.
- Defaults when missing: `time=alltime`, `status=all`, no `accountId`, empty `q`.
- View Ledger navigates to `/transactions?accountId={id}&time=alltime&status=settledOnly` (explicit trio).
- When updating filters from UI, omit default/empty params from the URL.
- Filter by exact `debt.account_id` when `accountId` is set (string-normalize both sides).
- Invalid `status` / `time` → defaults; unknown `accountId` → empty list + not-found hint.
- Sidebar Transactions stays `/transactions` (clears filters).
- No automated test suite in this repo; verify with the manual checklist in each task.
- Do not add an account picker dropdown; do not change auth/routes beyond query params on `/transactions`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/transactionFilters.js` | Parse URL params → filter model; serialize filter updates → `URLSearchParams`; status/time UI↔URL maps |
| `src/components/TransactionLedger.jsx` | Read/write search params; filter debts; account hint UI; drop filter props from parent |
| `src/App.jsx` | Remove filter state; simplify `handleViewLedger` to navigate with query string; stop passing filter props |

---

### Task 1: Transaction filter URL helpers

**Files:**
- Create: `src/lib/transactionFilters.js`

**Interfaces:**
- Consumes: none (pure module)
- Produces:
  - `parseTransactionFilters(searchParams: URLSearchParams) → { accountId: string|null, time: string, status: string, q: string }`
    - `time` is UI month value: `'all'` or `'YYYY-MM'`
    - `status` is UI status value: `'all'` | `'active'` | `'settled'`
  - `buildTransactionSearchParams(filters: { accountId?, time?, status?, q? }, options?: { explicitDefaults?: boolean }) → URLSearchParams`
    - When `explicitDefaults` is false/omitted: omit `time` if alltime/`all`, omit `status` if `all`, omit empty `q`, omit missing `accountId`
    - When `explicitDefaults` is true: always set `time` and `status` (used only if needed; View Ledger builds the string directly in App)
  - `STATUS_TO_URL` / `STATUS_FROM_URL` and time helpers as needed internally

- [ ] **Step 1: Create `src/lib/transactionFilters.js`**

```js
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
```

- [ ] **Step 2: Sanity-check helpers in Node**

Run from project root:

```bash
node --input-type=module -e "import { parseTransactionFilters, buildTransactionSearchParams, viewLedgerPath } from './src/lib/transactionFilters.js'; const p = new URLSearchParams('accountId=abc&time=alltime&status=settledOnly'); console.log(parseTransactionFilters(p)); console.log(buildTransactionSearchParams({ accountId: 'abc', time: 'all', status: 'settled', q: '' }).toString()); console.log(viewLedgerPath('xyz')); console.log(parseTransactionFilters(new URLSearchParams('status=nope&time=bad')));"
```

Expected stdout roughly:

```
{ accountId: 'abc', time: 'all', status: 'settled', q: '' }
accountId=abc&status=settledOnly
/transactions?accountId=xyz&time=alltime&status=settledOnly
{ accountId: null, time: 'all', status: 'all', q: '' }
```

- [ ] **Step 3: Commit** (only if the user asked to commit)

```bash
git add src/lib/transactionFilters.js
git commit -m "feat: add transaction filter URL helpers"
```

---

### Task 2: Wire `TransactionLedger` to URL params

**Files:**
- Modify: `src/components/TransactionLedger.jsx`

**Interfaces:**
- Consumes: `parseTransactionFilters`, `buildTransactionSearchParams` from `../lib/transactionFilters.js`; `useSearchParams` from `react-router-dom`
- Produces: ledger that no longer needs `searchQuery`, `statusFilter`, `monthFilter`, `onSearchChange`, `onStatusFilterChange`, `onMonthFilterChange` props

- [ ] **Step 1: Update imports and props**

At the top of `src/components/TransactionLedger.jsx`, add:

```jsx
import { useSearchParams } from 'react-router-dom'
import {
  parseTransactionFilters,
  buildTransactionSearchParams,
} from '../lib/transactionFilters'
```

Change the component signature to remove filter props. Keep data/action props:

```jsx
export default function TransactionLedger({
  debts,
  masterDebts,
  loading,
  editingId,
  onOpenAdd,
  onTogglePaid,
  onEdit,
  onDelete,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { accountId, time: monthFilter, status: statusFilter, q: searchQuery } =
    parseTransactionFilters(searchParams)

  function updateFilters(patch) {
    const next = {
      accountId,
      time: monthFilter,
      status: statusFilter,
      q: searchQuery,
      ...patch,
    }
    setSearchParams(buildTransactionSearchParams(next), { replace: true })
  }
```

- [ ] **Step 2: Add `accountId` to the filter predicate**

In the existing `filteredDebts` filter callback, after computing other matches (or before the return), add:

```jsx
    const matchesAccount =
      !accountId || String(debt.account_id) === String(accountId)
```

And include `matchesAccount` in the return:

```jsx
    return matchesMonth && matchesSearch && matchesStatus && matchesAccount
```

Keep existing `matchesMonth` / `matchesSearch` / `matchesStatus` logic; they already use `monthFilter`, `searchQuery`, and `statusFilter` which now come from parsed params.

- [ ] **Step 3: Wire selects and search to `updateFilters`**

Replace the month select `onChange`:

```jsx
onChange={(e) => updateFilters({ time: e.target.value })}
```

Replace the status select `onChange`:

```jsx
onChange={(e) => updateFilters({ status: e.target.value })}
```

Replace the search input `onChange`:

```jsx
onChange={(e) => updateFilters({ q: e.target.value })}
```

Keep `value={monthFilter}`, `value={statusFilter}`, `value={searchQuery}` (parsed UI values).

- [ ] **Step 4: Add clearable account filter hint**

Above the toolbar row that contains Add / selects / search (or directly above the table), resolve the account and render:

```jsx
  const filteredAccount = accountId
    ? masterDebts.find((md) => String(md.id) === String(accountId))
    : null
```

Then in JSX (near the filters header):

```jsx
          {accountId ? (
            <div className="flex items-center gap-3 text-xs font-medium text-neu-textMuted dark:text-darkNeu-textMuted">
              <span>
                {filteredAccount
                  ? `Filtered by account: ${filteredAccount.name}`
                  : 'Account not found'}
              </span>
              <button
                type="button"
                onClick={() => updateFilters({ accountId: null })}
                className="underline hover:opacity-80"
              >
                Clear
              </button>
            </div>
          ) : null}
```

Place it so it is visible when arriving from View Ledger (same section as the filter controls).

- [ ] **Step 5: Manual smoke on ledger alone**

This step may briefly break the build until Task 3 removes App props. If TypeScript is not in use, React will still warn about unused props — remove them in Task 3 immediately after.

Alternatively, temporarily leave unused props ignored, then finish Task 3 in the same session.

Verify after Task 3 (preferred). Skip standalone run here if App still passes old props (harmless extra props).

- [ ] **Step 6: Commit** (only if the user asked to commit)

```bash
git add src/components/TransactionLedger.jsx
git commit -m "feat: drive transaction ledger filters from URL params"
```

---

### Task 3: Update `App.jsx` navigation and remove filter state

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `viewLedgerPath` from `./lib/transactionFilters`
- Produces: `handleViewLedger` navigates with query string only; `/transactions` route no longer passes filter props

- [ ] **Step 1: Import `viewLedgerPath`**

Add:

```jsx
import { viewLedgerPath } from './lib/transactionFilters'
```

- [ ] **Step 2: Remove filter state**

Delete these three lines from `App`:

```jsx
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
```

- [ ] **Step 3: Replace `handleViewLedger`**

Replace the whole function with:

```jsx
  function handleViewLedger(account) {
    navigate(viewLedgerPath(account.id))
  }
```

- [ ] **Step 4: Slim `TransactionLedger` props on the route**

In the `/transactions` route element, remove filter-related props so it looks like:

```jsx
          <Route
            path="/transactions"
            element={
              <TransactionLedger
                debts={debts}
                masterDebts={masterDebts}
                loading={loadingDebts}
                editingId={editingId}
                onOpenAdd={() =>
                  setTransactionModal({
                    open: true,
                    mode: 'create',
                    data: null,
                  })
                }
                onTogglePaid={handleTogglePaid}
                onEdit={(debt) => {
                  setEditingId(debt.id)
                  setTransactionModal({
                    open: true,
                    mode: 'edit',
                    data: debt,
                  })
                }
                onDelete={handleDeleteDebt}
              />
            }
          />
```

- [ ] **Step 5: Verify build**

Run:

```bash
npm run build
```

Expected: Vite build exits 0 with no errors about missing props or unresolved imports.

- [ ] **Step 6: Manual end-to-end checklist**

Run `npm run dev`, sign in, then verify:

1. On Master Debts, click **View Ledger** → URL is `/transactions?accountId=…&time=alltime&status=settledOnly`; list shows only that account’s settled transactions; hint shows account name.
2. Change status to Active Only → URL `status` becomes `activeOnly`; list updates; refresh keeps filters.
3. Change time / type in search → URL `time` / `q` update; refresh keeps them.
4. Click **Clear** on the account hint → `accountId` removed; other params remain.
5. Sidebar → **Transactions** → `/transactions` with defaults (unfiltered).
6. Manually set `?accountId=not-a-real-id&status=settledOnly` → empty list + “Account not found”.
7. Manually set `?status=nope&time=bad` → behaves as all status / all time.

- [ ] **Step 7: Commit** (only if the user asked to commit)

```bash
git add src/App.jsx src/components/TransactionLedger.jsx src/lib/transactionFilters.js
git commit -m "feat: deep-link View Ledger with account URL filters"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| View Ledger → `accountId` + `time=alltime` + `status=settledOnly` | Task 1 (`viewLedgerPath`), Task 3 |
| Exact `account_id` filter | Task 2 |
| URL sync on filter changes | Task 2 (`updateFilters` / `setSearchParams`) |
| Param mapping UI ↔ URL | Task 1 |
| Omit defaults when writing from UI | Task 1 (`buildTransactionSearchParams`) |
| Invalid status/time → defaults | Task 1 (`parseTransactionFilters`) |
| Unknown account → hint + empty list | Task 2 |
| Clearable account hint | Task 2 |
| Remove App filter state | Task 3 |
| Sidebar `/transactions` clears | unchanged Sidebar; Task 3 checklist |
| No account dropdown | out of scope / not added |

No placeholders remaining after self-review.
