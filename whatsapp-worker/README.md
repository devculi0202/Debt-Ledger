# Debt Ledger — WhatsApp worker (Baileys)

Always-on Node service for WhatsApp Linked Devices + scheduled debt reminders. Shared reminder/money helpers come from `@debt-ledger/domain` (`packages/domain`).

## Why Railway (not Vercel/Netlify)

Baileys needs a long-lived process and a persistent auth volume. Serverless hosts will drop the session.

## Local development

From the **repo root** (so `file:../packages/domain` resolves):

```bash
cp whatsapp-worker/.env.example whatsapp-worker/.env
# fill SUPABASE_* keys
npm install --prefix whatsapp-worker
npm start --prefix whatsapp-worker
# or: npm run dev --prefix whatsapp-worker  (watch mode)
```

Point the web app at the worker with `VITE_WHATSAPP_API_URL=http://localhost:8787`, then open **Reminders** and scan the QR (WhatsApp → Linked devices).

## Railway setup

1. Create a new Railway service from this **repository** (Root Directory = repo root, not only `whatsapp-worker/`), so `@debt-ledger/domain` installs via `file:../packages/domain`.
2. Set install / start (or Nixpacks overrides):
   - Install: `npm install --prefix whatsapp-worker`
   - Start: `npm start --prefix whatsapp-worker`
3. Add a **Volume** mounted at `/data/auth` (or any path).
4. Set env vars (see `.env.example`):

```env
PORT=8787
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
WHATSAPP_AUTH_DIR=/data/auth
REMINDER_CRON_MS=1800000
CORS_ORIGIN=https://your-app.example,http://localhost:5173
# Optional ops token (also accepted as Bearer):
# WHATSAPP_API_SECRET=long-random-string
LOG_LEVEL=info
```

5. Deploy. Open the Debt Ledger **Reminders** page and scan the QR once.

> If you must keep Railway Root Directory = `whatsapp-worker`, copy `packages/domain` next to this package (or change the `file:` dependency) so `@debt-ledger/domain` still resolves.

## Auth

All routes except `/health` require `Authorization: Bearer <token>`:

| Token | Use |
| --- | --- |
| Supabase user access token | Normal app calls (status, QR, send, etc.) |
| `WHATSAPP_API_SECRET` | Ops / curl — **not** valid for `POST /reminders/test` (needs a signed-in user) |

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness + WhatsApp status |
| GET | `/whatsapp/status` | `{ status, qr, connected, linkedPhone }` — `status` is `disconnected` \| `qr` \| `connected` |
| GET | `/whatsapp/qr` | `{ status, qr }` — QR data URL when status is `qr` |
| POST | `/whatsapp/disconnect` | Logout, wipe auth, restart (new QR) |
| POST | `/whatsapp/relink` | Same as disconnect (forces a fresh QR) |
| POST | `/reminders/run` | Trigger scan. Body `{ "force": true }` sends all unpaid debts with due dates (ignores days-before window + prior sends for today) |
| POST | `/reminders/test` | One-line test message to the user’s reminder phone (user JWT required) |

## Reminder behavior

- Cron runs every `REMINDER_CRON_MS` (default 30 minutes), plus a scan ~15s after startup.
- Only users with `reminder_settings.enabled = true` are scanned on the cron (manual `/reminders/run` with a user token can target that user).
- Phone is optional: empty `reminder_settings.phone` sends to the **linked WhatsApp account**.
- Phone format: digits with country code, no `+` (e.g. `84901234567`). Local VN `0901…` is normalized to `84901…`.
- Template placeholders: `{person}`, `{amount}`, `{due_date}`, `{type}`, `{notes}` (defaults from `@debt-ledger/domain`).

## Notes

- App logout in Debt Ledger does **not** disconnect WhatsApp; use **Disconnect WhatsApp** on the reminders page.
- Baileys is unofficial; keep send volume low (self-reminders).
- Run [`supabase/migrations/20260731_reminder_tables.sql`](../supabase/migrations/20260731_reminder_tables.sql) in Supabase before enabling reminders.
