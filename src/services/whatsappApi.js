import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

const CTX = 'whatsappApi'

function baseUrl() {
  const url = import.meta.env.VITE_WHATSAPP_API_URL
  if (!url) return null
  return String(url).replace(/\/$/, '')
}

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not signed in')
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function request(path, options = {}) {
  const root = baseUrl()
  if (!root) {
    throw new Error(
      'VITE_WHATSAPP_API_URL is not set. Deploy the WhatsApp worker and add the URL to .env.',
    )
  }
  const headers = await authHeaders()
  const res = await fetch(`${root}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`
    logger.error('WhatsApp API error', CTX, { path, status: res.status, data })
    throw new Error(message)
  }
  return data
}

export function isWhatsAppApiConfigured() {
  return Boolean(baseUrl())
}

export const getStatus = () => request('/whatsapp/status')
export const getQr = () => request('/whatsapp/qr')
export const disconnect = () =>
  request('/whatsapp/disconnect', { method: 'POST', body: '{}' })
export const runReminders = () =>
  request('/reminders/run', { method: 'POST', body: '{}' })
