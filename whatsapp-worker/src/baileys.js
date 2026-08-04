import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import fs from 'node:fs/promises'
import path from 'node:path'
import pino from 'pino'

const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || path.join(process.cwd(), 'auth_info')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

let sock = null
let status = 'disconnected' // disconnected | qr | connected
let qrPayload = null // { raw, dataUrl }
let connecting = false
let intentionalDisconnect = false
let reconnectTimer = null

export function getWhatsAppState() {
  return {
    status,
    qr: qrPayload?.dataUrl ?? null,
    connected: status === 'connected',
  }
}

async function setQr(raw) {
  const dataUrl = await QRCode.toDataURL(raw, {
    margin: 2,
    width: 320,
    errorCorrectionLevel: 'M',
  })
  qrPayload = { raw, dataUrl }
  status = 'qr'
}

function clearQr() {
  qrPayload = null
}

async function ensureAuthDir() {
  await fs.mkdir(AUTH_DIR, { recursive: true })
}

async function wipeAuthDir() {
  await fs.rm(AUTH_DIR, { recursive: true, force: true })
  await ensureAuthDir()
}

function scheduleReconnect(delayMs) {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    startWhatsApp().catch((err) => logger.error({ err }, 'Reconnect failed'))
  }, delayMs)
}

export async function startWhatsApp() {
  if (connecting) return
  connecting = true
  try {
    await ensureAuthDir()
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      syncFullHistory: false,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        try {
          await setQr(qr)
          logger.info('WhatsApp QR ready for scan')
        } catch (err) {
          logger.error({ err }, 'Failed to encode QR')
        }
      }

      if (connection === 'open') {
        status = 'connected'
        clearQr()
        logger.info('WhatsApp connected')
      }

      if (connection === 'close') {
        const code = (lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : lastDisconnect?.error?.output?.statusCode) ?? 0
        const loggedOut = code === DisconnectReason.loggedOut
        // Bad session / forbidden — wipe auth so the next start can emit a QR
        const needsFreshAuth =
          loggedOut ||
          code === DisconnectReason.badSession ||
          code === DisconnectReason.forbidden ||
          code === 401 ||
          code === 403

        status = 'disconnected'
        clearQr()
        sock = null
        connecting = false
        logger.warn({ code, loggedOut, needsFreshAuth }, 'WhatsApp connection closed')

        // Relink/disconnect already restarts the socket itself
        if (intentionalDisconnect) {
          return
        }

        if (needsFreshAuth) {
          try {
            await wipeAuthDir()
          } catch (err) {
            logger.error({ err }, 'Failed to clear auth after disconnect')
          }
        }

        scheduleReconnect(needsFreshAuth ? 1000 : 3000)
      }
    })
  } finally {
    connecting = false
  }
}

export async function disconnectWhatsApp() {
  intentionalDisconnect = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  try {
    if (sock) {
      await sock.logout()
    }
  } catch (err) {
    logger.warn({ err }, 'logout() failed; wiping auth dir')
  }

  sock = null
  status = 'disconnected'
  clearQr()
  connecting = false

  try {
    await wipeAuthDir()
  } catch (err) {
    logger.error({ err }, 'Failed to clear auth dir')
  }

  intentionalDisconnect = false
  await startWhatsApp()
  return getWhatsAppState()
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) throw new Error('Phone number is empty')
  return digits
}

export async function sendTextMessage(phone, text) {
  if (!sock || status !== 'connected') {
    throw new Error('WhatsApp is not connected')
  }
  const jid = `${normalizePhone(phone)}@s.whatsapp.net`
  await sock.sendMessage(jid, { text })
}

export { logger }
