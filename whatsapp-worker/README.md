# Debt Ledger — WhatsApp worker (Baileys)

Always-on Node service for WhatsApp Linked Devices + scheduled debt reminders.

## Why Railway (not Vercel/Netlify)

Baileys needs a long-lived process and a persistent auth volume. Serverless hosts will drop the session.

## Railway setup

1. Create a new Railway service from this `whatsapp-worker/` folder (Root Directory = `whatsapp-worker`).
2. Add a **Volume** mounted at `/data/auth` (or any path).
3. Set env vars:

```env
PORT=8787
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
WHATSAPP_AUTH_DIR=/data/auth
REMINDER_CRON_MS=1800000
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:5173
# Optional ops token (also accepted as Bearer):
# WHATSAPP_API_SECRET=long-random-string
LOG_LEVEL=info
```

4. Deploy. Open the Debt Ledger **Reminder debt** page and scan the QR once (WhatsApp → Linked devices).

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
