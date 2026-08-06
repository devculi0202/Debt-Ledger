# Debt Ledger — WhatsApp worker (Baileys)

Always-on Node service for WhatsApp Linked Devices + scheduled debt reminders.

## Why Railway (not Vercel/Netlify)

Baileys needs a long-lived process and a persistent auth volume. Serverless hosts will drop the session.

## Railway setup

1. Create a new Railway service from this **repository** (Root Directory = repo root, not only `whatsapp-worker/`), so shared `@debt-ledger/domain` installs via `file:../packages/domain`.
2. Set install / start (or Nixpacks overrides):
   - Install: `npm install --prefix whatsapp-worker`
   - Start: `npm start --prefix whatsapp-worker`
3. Add a **Volume** mounted at `/data/auth` (or any path).
4. Set env vars:

```env
PORT=8787
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
WHATSAPP_AUTH_DIR=/data/auth
REMINDER_CRON_MS=1800000
CORS_ORIGIN=https://debt-ledger.devculi.space,http://localhost:5173
# Optional ops token (also accepted as Bearer):
# WHATSAPP_API_SECRET=long-random-string
LOG_LEVEL=info
```

5. Deploy. Open the Debt Ledger **Reminder Debt** page and scan the QR once (WhatsApp → Linked devices).

> If you must keep Railway Root Directory = `whatsapp-worker`, copy `packages/domain` next to this package (or change the `file:` dependency) so `@debt-ledger/domain` still resolves.

## API

All routes below (except `/health`) require `Authorization: Bearer <supabase_access_token>` (or `WHATSAPP_API_SECRET`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/whatsapp/status` | `disconnected` \| `qr` \| `connected` |
| GET | `/whatsapp/qr` | Current QR as data URL when status is `qr` |
| POST | `/whatsapp/disconnect` | Logout session (forces new QR) |
| POST | `/whatsapp/relink` | Wipe session and start fresh (forces new QR) |
| POST | `/reminders/run` | Trigger scan (`{ "force": true }` sends all unpaid debts with due dates) |
| POST | `/reminders/test` | Send a one-line test message to the user's reminder phone |

## Notes

- App logout in Debt Ledger does **not** disconnect WhatsApp.
- Baileys is unofficial; keep send volume low (self-reminders).
- Run [`supabase/migrations/20260731_reminder_tables.sql`](../supabase/migrations/20260731_reminder_tables.sql) in Supabase before enabling reminders.
