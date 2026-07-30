# Duplicate Transaction to Months — Design Spec

**Date:** 2026-07-30  
**Status:** Approved

## Problem

Users create one installment transaction (e.g. T8, 5,500,000 ₫ for a 33M master debt) and need identical records for other months (T1–T6) without re-entering all fields.

## Solution

Add a **Copy** action on each transaction row that opens a **Duplicate to months** modal. User selects target months; the app creates new unsettled records with shifted notes and dates.

## UX

- **Trigger:** Copy icon in Actions column (after Delete).
- **Modal:** Read-only summary of source record + month picker (T1–T12).
- **Source month:** Pre-checked, disabled, labeled “source — skip”.
- **Quick actions:** Select all, Clear all.
- **Preview table:** Target month, amount, tx date, due date, notes.
- **Confirm:** “Create N records” → batch insert → success toast → ledger refresh.
- **Validation:** Submit disabled when no months selected.
- **Conflict warning:** If same `account_id` already has a record whose notes match `T{n}` for a selected month, show a non-blocking warning.

## Field rules (Option B)

| Field | Rule |
|-------|------|
| Entity, amount, type, account_id | Copied from source |
| Notes | Replace `T{n}` token (e.g. `Trả nợ T8` → `Trả nợ T3`) |
| Tx date | Same day-of-month in target month; clamp to last day if invalid |
| Due date | Last day of target month |
| paid | Always `false` |
| Year | Same as source `transaction_date` |

## Source month detection

1. Parse `T{n}` from notes (case-insensitive).
2. Fallback: month from `transaction_date` (or `created_at`).

## Architecture

- `src/lib/duplicateTransactionMonths.js` — pure helpers (detect month, build payloads, find conflicts).
- `src/services/transactions.js` — `createMany(payloads)` batch insert.
- `src/hooks/useTransactions.js` — duplicate modal state + `handleDuplicateMonths`.
- `src/components/modals/DuplicateMonthsModal.jsx` — UI.
- Wire through `TransactionTable` → `TransactionLedger` → `TransactionsPage`.

## Out of scope

- Master-debt installment wizard.
- Editing source record during duplicate.
- Cross-year duplication.
