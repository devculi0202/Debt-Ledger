import express from 'express'
import cors from 'cors'
import {
  startWhatsApp,
  getWhatsAppState,
  disconnectWhatsApp,
  logger,
} from './baileys.js'
import { verifyUserJwt } from './supabase.js'
import { runReminderScan, sendTestReminder } from './scheduler.js'

const PORT = Number(process.env.PORT || 8787)
const CRON_MS = Number(process.env.REMINDER_CRON_MS || 30 * 60 * 1000)
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*'

const app = express()
app.use(
  cors({
    origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN.split(',').map((s) => s.trim()),
  }),
)
app.use(express.json())

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' })
  }

  // Shared secret for ops / health tooling (optional)
  if (process.env.WHATSAPP_API_SECRET && token === process.env.WHATSAPP_API_SECRET) {
    req.auth = { type: 'secret' }
    return next()
  }

  const user = await verifyUserJwt(token)
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  req.auth = { type: 'user', user }
  return next()
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, whatsapp: getWhatsAppState().status })
})

app.get('/whatsapp/status', requireAuth, (_req, res) => {
  res.json(getWhatsAppState())
})

app.get('/whatsapp/qr', requireAuth, (_req, res) => {
  const state = getWhatsAppState()
  res.json({
    status: state.status,
    qr: state.qr,
  })
})

app.post('/whatsapp/disconnect', requireAuth, async (_req, res) => {
  try {
    const state = await disconnectWhatsApp()
    res.json(state)
  } catch (err) {
    logger.error({ err }, 'disconnect failed')
    res.status(500).json({ error: err?.message || 'Disconnect failed' })
  }
})

/** Wipe session (if any) and start a fresh Baileys socket so a QR can appear. */
app.post('/whatsapp/relink', requireAuth, async (_req, res) => {
  try {
    const state = await disconnectWhatsApp()
    res.json(state)
  } catch (err) {
    logger.error({ err }, 'relink failed')
    res.status(500).json({ error: err?.message || 'Relink failed' })
  }
})

app.post('/reminders/run', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.type === 'user' ? req.auth.user.id : undefined
    const force = Boolean(req.body?.force)
    const result = await runReminderScan({ userId, force })
    res.json(result)
  } catch (err) {
    logger.error({ err }, 'manual reminder run failed')
    res.status(500).json({ error: err?.message || 'Reminder run failed' })
  }
})

app.post('/reminders/test', requireAuth, async (req, res) => {
  try {
    if (req.auth?.type !== 'user') {
      return res.status(400).json({
        error: 'Test send requires a signed-in user token (not API secret alone).',
      })
    }
    const result = await sendTestReminder(req.auth.user.id)
    if (!result.ok) {
      const messages = {
        disconnected: 'WhatsApp is not connected',
        no_settings: 'Save reminder settings first',
        no_phone: 'Set a phone number in reminder settings (or link WhatsApp first)',
        no_admin: 'Worker Supabase admin is not configured',
        no_user: 'Missing user',
        send_failed: result.error || 'WhatsApp send failed',
      }
      return res.status(400).json({
        error: messages[result.reason] || result.reason || 'Test send failed',
        reason: result.reason,
        linkedPhone: result.linkedPhone,
      })
    }
    res.json(result)
  } catch (err) {
    logger.error({ err }, 'test reminder failed')
    res.status(500).json({ error: err?.message || 'Test send failed' })
  }
})

async function main() {
  await startWhatsApp()
  setInterval(() => {
    runReminderScan().catch((err) => logger.error({ err }, 'scheduled scan failed'))
  }, CRON_MS)

  // Kick once shortly after boot
  setTimeout(() => {
    runReminderScan().catch((err) => logger.error({ err }, 'startup scan failed'))
  }, 15_000)

  app.listen(PORT, () => {
    logger.info(`WhatsApp worker listening on :${PORT}`)
  })
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error')
  process.exit(1)
})
