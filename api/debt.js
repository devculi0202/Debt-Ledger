import Groq from 'groq-sdk'

const WHISPER_MODEL = 'whisper-large-v3-turbo'
const EXTRACT_MODEL = 'llama-3.1-8b-instant'
const VALID_ACTIONS = new Set(['lent', 'borrowed', 'repaid'])

const SYSTEM_PROMPT = `You extract debt transaction information from Vietnamese natural language (or English).
Return ONLY a valid JSON object with exactly these keys:
- person_name (string): the other person's name (proper capitalization, e.g. "Minh" not "minh")
- amount (number): total amount in VND as a plain integer (no separators, no currency symbols)
- currency (string): default "VND" if not specified
- action (string): exactly one of "lent", "borrowed", or "repaid"
  - "lent": the speaker lent money to someone (cho vay / cho mượn / cho ... mượn)
  - "borrowed": the speaker borrowed money from someone (vay / mượn từ / đi vay)
  - "repaid": the speaker paid back a debt (trả nợ / trả lại / đã trả)
- reason (string): short description; exclude due-date-only phrases if captured in due_date
- due_date (string|null): ISO date YYYY-MM-DD when repayment timing is mentioned, otherwise null
  - "tháng 8 trả" / "trả tháng 8" → last day of August (e.g. 2026-08-31); use current year, or next year if that month already passed
  - "ngày 15 tháng 9" → 2026-09-15 with the same year rule
  - vague timing with no month/day → null

Vietnamese amount rules (always convert to full VND integer before returning amount):
- 1 triệu = 1,000,000
- 1 nghìn / 1 ngàn = 1,000
- 1 tỷ = 1,000,000,000
- "200 triệu" → amount: 200000000
- "1 triệu rưỡi" / "1.5 triệu" → amount: 1500000
- "500 nghìn" → amount: 500000

Do not include markdown, code fences, or extra keys.`

function jsonResponse(body, status = 200) {
  return Response.json(body, { status })
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }
  return new Groq({ apiKey })
}

async function parseRequestBody(request) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json()
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    return { text, audio: null }
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const textField = formData.get('text')
    const audio = formData.get('audio')

    const text =
      typeof textField === 'string'
        ? textField.trim()
        : textField != null
          ? String(textField).trim()
          : ''

    const audioFile =
      audio && typeof audio === 'object' && 'arrayBuffer' in audio ? audio : null

    return { text, audio: audioFile }
  }

  throw new Error('Unsupported Content-Type. Use application/json or multipart/form-data.')
}

async function transcribeAudio(groq, audioFile) {
  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: WHISPER_MODEL,
    language: 'vi',
  })

  const text = transcription.text?.trim()
  if (!text) {
    throw new Error('Could not transcribe audio. Please try again.')
  }
  return text
}

async function extractDebtData(groq, sourceText) {
  const completion = await groq.chat.completions.create({
    model: EXTRACT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: sourceText },
    ],
    temperature: 0.1,
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw new Error('No extraction result from the model.')
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Model returned invalid JSON.')
  }

  return normalizeExtracted(parsed, sourceText)
}

function parseIsoDate(value) {
  if (value == null || value === '') return null
  const s = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }
  return s
}

function inferDueDateFromText(text, reference = new Date()) {
  const dayMonth = text.match(
    /(?:ngày\s*)?(\d{1,2})\s*th[aá]ng\s*(\d{1,2})/i,
  )
  if (dayMonth) {
    const day = parseInt(dayMonth[1], 10)
    const month = parseInt(dayMonth[2], 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let year = reference.getFullYear()
      const nowMonth = reference.getMonth() + 1
      const nowDay = reference.getDate()
      if (month < nowMonth || (month === nowMonth && day < nowDay)) {
        year += 1
      }
      const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return parseIsoDate(candidate)
    }
  }

  const monthOnly = text.match(/th[aá]ng\s*(\d{1,2})(?:\s*tr[aả])?/i)
  if (!monthOnly) return null

  const month = parseInt(monthOnly[1], 10)
  if (month < 1 || month > 12) return null

  let year = reference.getFullYear()
  if (month < reference.getMonth() + 1) year += 1

  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

function normalizeVndAmount(amount, text) {
  let n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return n

  const tyMatch = text.match(/(\d+(?:[.,]\d+)?)\s*t[yỷ]/i)
  if (tyMatch) {
    return Math.round(parseFloat(tyMatch[1].replace(',', '.')) * 1_000_000_000)
  }

  const trieuMatch = text.match(/(\d+(?:[.,]\d+)?)\s*tri[eệ]u/i)
  if (trieuMatch) {
    return Math.round(parseFloat(trieuMatch[1].replace(',', '.')) * 1_000_000)
  }

  const nghinMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ngh[iì]n|ng[aà]n)/i)
  if (nghinMatch) {
    return Math.round(parseFloat(nghinMatch[1].replace(',', '.')) * 1_000)
  }

  // Model returned bare millions count without scaling (e.g. 200 for "200 triệu")
  if (n < 1_000_000 && /tri[eệ]u/i.test(text)) {
    return Math.round(n * 1_000_000)
  }

  return Math.round(n)
}

function normalizeExtracted(data, sourceText = '') {
  const person_name = String(data?.person_name ?? '').trim()
  let amount = normalizeVndAmount(Number(data?.amount), sourceText)
  const currency = String(data?.currency ?? 'VND').trim() || 'VND'
  const action = String(data?.action ?? '').trim().toLowerCase()
  const reason = String(data?.reason ?? '').trim()

  let due_date = parseIsoDate(data?.due_date)
  if (!due_date && sourceText) {
    due_date = inferDueDateFromText(sourceText)
  }

  if (!person_name) {
    throw new Error('Could not identify a person name from the input.')
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Could not identify a valid amount from the input.')
  }
  if (!VALID_ACTIONS.has(action)) {
    throw new Error(`Invalid action "${action}". Expected lent, borrowed, or repaid.`)
  }

  return {
    person_name,
    amount,
    currency,
    action,
    reason,
    due_date,
  }
}

function toTransactionPayload(extracted) {
  const today = new Date().toISOString().split('T')[0]
  let type = 'owe'
  let paid = false

  if (extracted.action === 'lent') {
    type = 'owed'
  } else if (extracted.action === 'repaid') {
    paid = true
  }

  return {
    type,
    person: extracted.person_name,
    amount: Math.round(extracted.amount),
    transaction_date: today,
    due_date: extracted.due_date ?? null,
    notes: extracted.reason || '',
    account_id: null,
    paid,
  }
}

export default {
  async POST(request) {
    try {
      if (!process.env.GROQ_API_KEY) {
        return jsonResponse(
          { error: 'Server is missing GROQ_API_KEY configuration.' },
          500,
        )
      }

      const { text, audio } = await parseRequestBody(request)

      console.log('[api/debt] input', {
        type: audio ? 'audio' : 'text',
        text: text || null,
        audioSize: audio?.size ?? null,
        audioType: audio?.type ?? null,
      })

      if (!text && !audio) {
        return jsonResponse(
          { error: 'Provide either JSON body { "text": "..." } or multipart field "audio".' },
          400,
        )
      }

      const groq = getGroqClient()
      let sourceText = text

      if (audio) {
        sourceText = await transcribeAudio(groq, audio)
        console.log('[api/debt] transcript', sourceText)
      }

      if (!sourceText) {
        return jsonResponse({ error: 'No text to process.' }, 400)
      }

      const data = await extractDebtData(groq, sourceText)
      const transaction = toTransactionPayload(data)

      console.log('[api/debt] response', { success: true, data: transaction })

      return jsonResponse({ success: true, data: transaction })
    } catch (err) {
      console.error('[api/debt] error', { message: err?.message, stack: err?.stack })

      const message = err?.message || 'Internal server error'
      const status =
        message.includes('Unsupported Content-Type') ||
        message.includes('Provide either') ||
        message.includes('No text to process') ||
        message.includes('Could not identify') ||
        message.includes('Invalid action')
          ? 400
          : 500

      return jsonResponse({ error: message }, status)
    }
  },
}
