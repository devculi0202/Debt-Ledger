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

export const submitText = async (text) => {
  logger.info('Submitting text debt', CTX)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    return await handleResponse(res)
  } catch (err) {
    if (err instanceof TypeError) {
      logger.error('Network error submitting text', CTX, err)
      throw new Error('Could not reach the server. Please try again.', { cause: err })
    }
    throw err
  }
}

export const submitAudio = async (blob) => {
  const mime = blob.type || 'audio/webm'
  const ext = mime.includes('mp4') ? 'mp4' : 'webm'
  const form = new FormData()
  form.append('audio', blob, `recording.${ext}`)

  logger.info('Submitting audio debt', CTX, { type: mime, size: blob.size })
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      body: form,
    })
    return await handleResponse(res)
  } catch (err) {
    if (err instanceof TypeError) {
      logger.error('Network error submitting audio', CTX, err)
      throw new Error('Could not reach the server. Please try again.', { cause: err })
    }
    throw err
  }
}
