import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
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
    linkedPhone: getLinkedPhoneDigits(),
  }
}

function getLinkedPhoneDigits() {
  if (!sock?.user?.id) return null
  try {
    return jidNormalizedUser(sock.user.id).split('@')[0] || null
  } catch {
    return String(sock.user.id).split('@')[0].split(':')[0] || null
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
      markOnlineOnConnect: false,
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
        logger.info({ linkedPhone: getLinkedPhoneDigits() }, 'WhatsApp connected')
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

/**
 * Normalize to WhatsApp PN digits (country code, no +).
 * Converts common VN local forms like 0901… → 84901…
 */
export function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (!digits) throw new Error('Phone number is empty')
  if (digits.startsWith('00')) digits = digits.slice(2)
  // Local VN mobiles are often typed with a leading 0
  if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 11) {
    digits = `84${digits.slice(1)}`
  }
  if (digits.length < 10 || digits.length > 15) {
    throw new Error(
      `Invalid phone "${phone}". Use country code without +, e.g. 84901234567`,
    )
  }
  return digits
}

async function resolveRecipientJid(phone) {
  if (!sock || status !== 'connected') {
    throw new Error('WhatsApp is not connected')
  }

  const linked = getLinkedPhoneDigits()
  const linkedJid = linked ? `${linked}@s.whatsapp.net` : null

  // Empty phone → message the linked WhatsApp account (self-reminder default)
  if (!String(phone || '').trim()) {
    if (!linkedJid) throw new Error('WhatsApp linked account id is missing')
    return { jid: linkedJid, digits: linked, isSelf: true, via: 'linked' }
  }

  const digits = normalizePhone(phone)

  // Same account that scanned the QR — use normalized linked JID (not :device form)
  if (linked && digits === linked) {
    return { jid: linkedJid, digits, isSelf: true, via: 'self' }
  }

  // Verify the number is registered on WhatsApp; bare JIDs often "succeed" with no delivery
  let results
  try {
    results = await sock.onWhatsApp(digits)
  } catch (err) {
    logger.error({ err, digits }, 'onWhatsApp failed')
    throw new Error(`Could not verify phone ${digits} on WhatsApp`)
  }

  const match = (Array.isArray(results) ? results : []).find((r) => r?.exists && r?.jid)
  if (!match) {
    throw new Error(
      `Phone ${digits} is not on WhatsApp (or wrong country code). Example: 84901234567`,
    )
  }

  return {
    jid: jidNormalizedUser(match.jid),
    digits,
    isSelf: false,
    via: 'onWhatsApp',
  }
}

/**
 * Send a text message. Returns delivery metadata so callers can surface real failures.
 * Baileys often does not throw for a bad/unregistered JID — we verify first.
 */
export async function sendTextMessage(phone, text) {
  const recipient = await resolveRecipientJid(phone)
  const msg = await sock.sendMessage(recipient.jid, { text: String(text || '') })
  const messageId = msg?.key?.id
  if (!messageId) {
    throw new Error('WhatsApp send returned no message id')
  }
  logger.info(
    {
      jid: recipient.jid,
      digits: recipient.digits,
      isSelf: recipient.isSelf,
      via: recipient.via,
      messageId,
    },
    'WhatsApp message sent',
  )
  return {
    jid: recipient.jid,
    digits: recipient.digits,
    isSelf: recipient.isSelf,
    via: recipient.via,
    messageId,
  }
}

export { logger }
