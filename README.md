# Debt Ledger

A personal finance web app for tracking **who you owe**, **who owes you**, and the transactions linked to each account.

Built with React and Supabase. Amounts are shown in **VNĐ**.

---

## Features

| Area | What you can do |
| --- | --- |
| **Auth** | Sign in with GitHub (Supabase Auth) |
| **Master Debts** | Create accounts with name, type (I Owe / Owed to Me), principal, and creditor |
| **Transactions** | Log entries with person, amount, dates, notes, and optional link to a master account |
| **Summary** | See net position, receivables, and liabilities at a glance |
| **Filters** | Filter by month, status (active / settled), account, or search text |
| **Actions** | Edit, delete, or mark a transaction as settled |
| **Theme** | Light / dark mode (follows system preference) |
| **Extras** | Built-in calculator (floating button) |

---

## Tech Stack

- **React 19** + **Vite**
- **React Router** — `/login`, `/master-debts`, `/transactions`
- **Tailwind CSS v4** — neumorphic UI
- **Lucide React** — icons
- **Supabase** — Auth + Postgres (`debt_accounts`, `debts`)

---

## Prerequisites

- Node.js 18+ (recommended)
- A [Supabase](https://supabase.com) project
- GitHub OAuth enabled in Supabase Auth (for “Continue with GitHub”)

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd "Debt Ledger"
npm install
```

### 2. Environment variables

Copy the example file and fill in your Supabase keys:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_LOG_LEVEL=debug
```

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |
| `VITE_LOG_LEVEL` | Optional log level (e.g. `debug`) |

> Never commit `.env`. Only `.env.example` should be in the repo.

### 3. Supabase Auth

1. In the Supabase dashboard, open **Authentication → Providers**.
2. Enable **GitHub** and add your OAuth app credentials.
3. Set the redirect URL to your local or production origin (e.g. `http://localhost:5173`).

### 4. Database tables

The app expects these tables (with RLS policies for the signed-in user):

- **`debt_accounts`** — master debt accounts  
- **`debts`** — individual transactions (optional `account_id` link)

### 5. Run locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## App routes

| Path | Access | Page |
| --- | --- | --- |
| `/login` | Public | GitHub sign-in |
| `/master-debts` | Protected | Master debt accounts |
| `/transactions` | Protected | Transaction ledger |

Unauthenticated users are redirected to `/login`. After sign-in, you land on **Master Debts**.

---

## Project structure

```
src/
  components/     UI, modals, sidebar, ledger pieces
  contexts/       Shared data (accounts + transactions)
  hooks/          Auth, theme, confirm, data hooks
  lib/            Supabase client, formatters, filters
  pages/          Login, Master Debts, Transactions
  services/       Supabase API calls (auth, accounts, debts)
```

---

## Deploy (Vercel)

The repo includes `vercel.json` so client-side routes work (SPA rewrite to `index.html`).

1. Connect the repo to Vercel.
2. Add the same `VITE_*` env vars in the Vercel project settings.
3. Deploy. Set your production URL as an allowed redirect in Supabase Auth.

---

## License

Private project (`"private": true` in `package.json`).
