# Transaction ledger URL filters

**Date:** 2026-07-29  
**Status:** Approved for planning  
**Approach:** URL search params as source of truth (`useSearchParams`)

## Problem

“View Ledger” navigates to `/transactions` but applies filters only via React state in `App.jsx` (search by account name, status `settled`, month `all`). The URL has no query string, so filters are not shareable, refresh-safe, or deep-linkable. Filtering by account name can also match unrelated text.

## Goals

- View Ledger opens `/transactions?accountId={id}&time=alltime&status=settledOnly`.
- Filter by exact linked `debt.account_id` when `accountId` is present.
- Keep filters in sync with the URL: changing status, time, or search updates the query string; loading/refreshing restores them.
- Preserve existing ledger UI (month select, status select, search box) with param mapping at the boundary.

## Non-goals

- Account dropdown to pick `accountId` (v1 uses View Ledger or a pasted URL).
- Preserving query params when clicking Sidebar → Transactions (link stays `/transactions` with defaults).
- Server-side filtering or API changes.
- Changing auth or route path structure (`/transactions` stays).

## URL schema

Path: `/transactions`

| Param | Values | Default when missing | Meaning |
|-------|--------|----------------------|---------|
| `accountId` | account UUID | (none) | Exact match on `debt.account_id` |
| `time` | `alltime` or `YYYY-MM` | `alltime` | Period filter |
| `status` | `all` \| `activeOnly` \| `settledOnly` | `all` | Status filter |
| `q` | string | (empty) | Search person / notes / account name |

### View Ledger

Navigate to:

```
/transactions?accountId={account.id}&time=alltime&status=settledOnly
```

No React filter state setters in `handleViewLedger` — navigation alone drives filters.

### Writing params

- Prefer omitting default/empty params when updating the URL (`status=all`, `time=alltime`, empty `q`, missing `accountId`) so casual browsing stays clean.
- View Ledger still writes the explicit trio (`accountId`, `time=alltime`, `status=settledOnly`) so the intent is visible in the address bar.

### Invalid values

- Unknown `status` or `time` → fall back to defaults (`all` / `alltime`).
- Unknown / deleted `accountId` → empty filtered list; show hint that the account was not found (or show the raw id).

## Architecture

1. Remove `searchQuery`, `statusFilter`, and `monthFilter` state from `App.jsx` (and related props plumbing used only for filters).
2. Own filter state on the transactions screen via `useSearchParams` (logic in `TransactionLedger` or a thin wrapper/helper used by that route).
3. Map UI control values ↔ URL values at the boundary:

   | UI | URL |
   |----|-----|
   | month `all` | `time=alltime` |
   | month `YYYY-MM` | `time=YYYY-MM` |
   | status `all` | `status=all` (or omit) |
   | status `active` | `status=activeOnly` |
   | status `settled` | `status=settledOnly` |
   | search text | `q` |
   | — | `accountId` |

4. Filtering in the ledger:
   - Existing month / status / text search logic unchanged in spirit.
   - Additional gate: if `accountId` present, `debt.account_id` must equal it (strict equality after normalizing string/number as needed).

5. `handleViewLedger(account)` → `navigate(\`/transactions?accountId=${account.id}&time=alltime&status=settledOnly\`)`.

6. Sidebar Transactions → `/transactions` (clears to defaults).

## UI

- Keep month select, status select, and search input.
- When `accountId` is present, show a clearable hint: “Filtered by account: {name}” (resolve name from `masterDebts`). Clearing removes `accountId` from the URL; other params remain.
- No new account picker in v1.

## Testing (manual)

1. View Ledger → URL contains `accountId`, `time=alltime`, `status=settledOnly`; list shows only that account’s settled transactions.
2. Change status / time / search → URL updates; refresh keeps the same filters.
3. Clear account hint → `accountId` removed; other params remain.
4. Sidebar → Transactions → unfiltered defaults.
5. Paste invalid `accountId` → empty list + not-found hint.
6. Paste invalid `status` / `time` → defaults applied.

## Out of scope follow-ups

- Dedicated account filter dropdown on the ledger.
- Sidebar preserving current query params.
