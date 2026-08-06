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
const ALLOWED_ORIGIN = (process.env.CORS_ORIGIN || '*').trim()

const allowedOrigins =
  ALLOWED_ORIGIN === '*'
    ? null
    : ALLOWED_ORIGIN.split(',')
        .map((s) => s.trim().replace(/\/$/, ''))
        .filter(Boolean)

const corsOptions = {
  origin(origin, callback) {
    // Non-browser clients (curl, Railway health) send no Origin
    if (!origin) {
      callback(null, true)
      return
    }
    if (!allowedOrigins) {
      callback(null, true)
      return
    }
    const normalized = origin.replace(/\/$/, '')
    if (allowedOrigins.includes(normalized)) {
      callback(null, true)
      return
    }
    logger.warn({ origin, allowedOrigins }, 'CORS rejected origin')
    callback(null, false)
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  optionsSuccessStatus: 204,
}

const app = express()
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' })
  }

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
  // Listen BEFORE Baileys so Railway/CORS preflight work while WhatsApp connects
  await new Promise((resolve) => {
    app.listen(PORT, () => {
      logger.info(
        { port: PORT, cors: allowedOrigins || '*' },
        'WhatsApp worker listening',
      )
      resolve()
    })
  })

  startWhatsApp().catch((err) => logger.error({ err }, 'WhatsApp start failed'))

  setInterval(() => {
    runReminderScan().catch((err) => logger.error({ err }, 'scheduled scan failed'))
  }, CRON_MS)

  setTimeout(() => {
    runReminderScan().catch((err) => logger.error({ err }, 'startup scan failed'))
  }, 15_000)
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error')
  process.exit(1)
})
