# AGENTS.md

## Cursor Cloud specific instructions

Debt Ledger is a **React 19 + Vite** SPA (frontend) backed by **Supabase** (Auth + Postgres),
plus two optional Node services:

- `api/debt.js` — Vercel serverless "voice debt" endpoint (needs `GROQ_API_KEY`; runs via `vercel dev` / `npm run dev:full`).
- `whatsapp-worker/` — always-on Baileys WhatsApp reminder worker (needs a Supabase service-role key + a real WhatsApp scan; deployed to Railway in prod).

Standard commands live in `package.json` and `README.md`. `npm run dev` (Vite, port `5173`),
`npm run build`, `npm run lint`, `npm run preview`. Dependencies are installed by the startup update
script (`npm install` in the repo root and in `whatsapp-worker/`).

### Environment variables (required to run the frontend)

The frontend throws on boot if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing
(see `src/lib/supabase.js`). Create a `.env` (git-ignored) from `.env.example`. Vite only reads
`.env` at startup — **restart `npm run dev` after editing `.env`** (hot reload does not pick up env changes).

### Non-obvious gotchas

- **Login is GitHub-OAuth-only** in the UI (`src/pages/LoginPage.jsx`). There is no email/password form.
  Real GitHub sign-in needs a GitHub OAuth app configured in Supabase Auth. For local testing you can
  bypass the OAuth button by minting a session and letting supabase-js pick it up from the URL hash
  (`detectSessionInUrl` is on): create a confirmed user with the GoTrue admin API, exchange
  email/password at `/auth/v1/token?grant_type=password`, then open
  `http://localhost:5173/#access_token=...&refresh_token=...&expires_in=3600&token_type=bearer`.
- **The base `debts` / `debt_accounts` tables are NOT in `supabase/migrations/`.** The committed
  migration `20260731_reminder_tables.sql` only *alters* `debts` and adds the reminder tables; it assumes
  `debts`/`debt_accounts` already exist (they were created by hand in the owner's hosted project). A
  local-dev base schema (inferred from `src/services/*` and `src/components/modals/*`) is provided in
  `supabase/migrations/20260101000000_local_base_schema.sql` so `supabase start` produces a working DB.
  Treat that file as local scaffolding, not the authoritative schema.
- Amounts are stored as plain VND integers (`bigint`). Row-level security scopes every row to
  `auth.uid() = user_id`, so inserts must include `user_id`.

### Running a fully-local Supabase (optional, for end-to-end DB/auth testing)

Requires Docker + the Supabase CLI (neither is in the update script — install on demand).
With Docker 29, set `/etc/docker/daemon.json` to `{"storage-driver":"fuse-overlayfs","features":{"containerd-snapshotter":false}}`
and use `iptables-legacy`, otherwise the stack fails to start in this VM.

```bash
supabase start                 # boots Postgres + Auth + Studio, applies supabase/migrations/*
supabase status -o env         # prints ANON_KEY / SERVICE_ROLE_KEY / API URL (http://127.0.0.1:54321)
```

Then set `VITE_SUPABASE_URL=http://127.0.0.1:54321` and `VITE_SUPABASE_ANON_KEY=<ANON_KEY>` in `.env`
and restart Vite. Create a test user:

```bash
curl -X POST http://127.0.0.1:54321/auth/v1/admin/users \
  -H "apikey: <SERVICE_ROLE_KEY>" -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"devpassword123","email_confirm":true}'
```
