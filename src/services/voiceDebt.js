import logger from '../lib/logger'

const CTX = 'voiceDebt'
const ENDPOINT = '/api/debt'

async function parseResponse(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function handleResponse(res) {
  const data = await parseResponse(res)
  if (!res.ok) {
    const message =
      (typeof data === 'object' && data && (data.message || data.error)) ||
      `Request failed (${res.status})`
    const err = new Error(typeof message === 'string' ? message : 'Request failed')
    logger.error('submit failed', CTX, { status: res.status, data })
    throw err
  }
  return data
}

async function postDebt(label, init, meta) {
  logger.info(`Submitting ${label} debt`, CTX, meta)
  try {
    const res = await fetch(ENDPOINT, init)
    return await handleResponse(res)
  } catch (err) {
    if (err instanceof TypeError) {
      logger.error(`Network error submitting ${label}`, CTX, err)
      throw new Error('Could not reach the server. Please try again.', { cause: err })
    }
    throw err
  }
}

export const submitText = async (text) =>
  postDebt('text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

export const submitAudio = async (blob) => {
  const mime = blob.type || 'audio/webm'
  const ext = mime.includes('mp4') ? 'mp4' : 'webm'
  const form = new FormData()
  form.append('audio', blob, `recording.${ext}`)

  return postDebt(
    'audio',
    {
      method: 'POST',
      body: form,
    },
    { type: mime, size: blob.size },
  )
}
