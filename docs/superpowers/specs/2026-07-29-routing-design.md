# Client-side routing for Debt Ledger

**Date:** 2026-07-29  
**Status:** Approved for planning  
**Approach:** React Router (`react-router-dom`) with browser URLs and bidirectional auth redirects

## Problem

Navigation between login, master debt accounts, and the transaction ledger is driven by React state (`activeTab` / session gate). URLs do not reflect the current screen, so deep links, refresh, and browser history do not work as expected.

## Goals

- Map screens to stable URL paths.
- Protect authenticated routes when signed out; keep signed-in users off the login screen.
- Keep existing data fetching, modals, and UI behavior unchanged aside from navigation.

## Non-goals

- Redesigning the login UI.
- Per-account deep links or query-string filters in the URL.
- Server-side auth middleware or SSR.

## Routes

| Path | Signed out | Signed in |
|------|------------|-----------|
| `/` | Login screen | Redirect to `/master-debts` |
| `/login` | Login screen | Redirect to `/master-debts` |
| `/master-debts` | Redirect to `/login` | Master Debts list (`MasterDebtList`) |
| `/transactions` | Redirect to `/login` | Transaction ledger (`TransactionLedger`) |
| `*` (unknown) | Redirect to `/login` | Redirect to `/master-debts` |

### Auth transitions

- Successful GitHub OAuth / session established → navigate to `/master-debts`.
- Sign out → navigate to `/login`.
- Sidebar “Master Debts” → `/master-debts`.
- Sidebar “Transactions” → `/transactions`.
- “View ledger” from an account → navigate to `/transactions` and apply the same filter state as today (`searchQuery` = account name, status/month filters as currently set).

## Architecture

### Dependency

Add `react-router-dom`. Wrap the app with `BrowserRouter` in `main.jsx`.

### Route layout

1. **Public login route** (`/` and `/login`): render the existing login container. If a session exists, `<Navigate to="/master-debts" replace />`.
2. **Protected layout** (parent for `/master-debts` and `/transactions`): if no session, `<Navigate to="/login" replace />`. Otherwise render the current authenticated shell (Sidebar, main content outlet, modals).
3. **Child routes** under the protected layout:
   - `master-debts` → `MasterDebtList`
   - `transactions` → `TransactionLedger`

Session loading: while the initial Supabase session is unresolved, avoid flashing the wrong redirect (brief loading state or hold render until `getSession` completes).

### State changes

- Remove `activeTab` as the source of truth for which screen is visible; derive the active nav item from the current pathname.
- Keep session, debts, master debts, filters, modals, and CRUD handlers in the existing app/layout owner so routing only selects the view.

### Sidebar

Replace tab-change callbacks with navigational links (`NavLink` or `useNavigate`) to `/master-debts` and `/transactions`. Active styles are based on the matched route.

### Components

- Prefer extracting the login screen into a small page component for clarity.
- Prefer a thin `ProtectedRoute` / layout wrapper for the auth redirect.
- Avoid large refactors of `MasterDebtList`, `TransactionLedger`, or modals.

## Data flow

Unchanged from today:

1. Supabase `getSession` + `onAuthStateChange` drive `session`.
2. When `session` is present, fetch `debt_accounts` and `debts`.
3. Views and modals receive props from the layout owner; routes do not own data.

## Error handling

- Unknown paths: session-based redirect as in the routes table.
- Auth/API errors: keep existing `alert` behavior; no new error route pages.

## Testing (manual)

1. Signed out: `/` and `/login` show login; `/master-debts` and `/transactions` redirect to `/login`.
2. Sign in → lands on `/master-debts`.
3. Sidebar and direct URL entry switch correctly between `/master-debts` and `/transactions`.
4. Signed in: `/` and `/login` redirect to `/master-debts`.
5. Sign out → `/login`.
6. Browser back/forward restores the correct view.
7. “View ledger” from Master Debts opens `/transactions` with filters applied.

## Alternatives considered

1. **React Router (chosen)** — standard Vite SPA routing, bookmarks, history, clear auth redirects.
2. **Manual history sync** — no dependency, but reimplements matching, redirects, and nav.
3. **HashRouter** — avoids server rewrite concerns; uglier URLs; unnecessary for this Vite app.
