import Groq from 'groq-sdk'

const WHISPER_MODEL = 'whisper-large-v3-turbo'
const EXTRACT_MODEL = 'llama-3.1-8b-instant'
const VALID_ACTIONS = new Set(['lent', 'borrowed', 'repaid'])

const SYSTEM_PROMPT = `You extract debt transaction information from Vietnamese natural language (or English).
Return ONLY a valid JSON object with exactly these keys:
- person_name (string): the other person's name
- amount (number): numeric amount only, no currency symbols or separators
- currency (string): default "VND" if not specified
- action (string): exactly one of "lent", "borrowed", or "repaid"
  - "lent": the speaker lent money to someone (cho vay / cho mượn)
  - "borrowed": the speaker borrowed money from someone (vay / mượn)
  - "repaid": the speaker paid back a debt (trả nợ / trả lại)
- reason (string): short description of the debt or transaction

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

  return normalizeExtracted(parsed)
}

function normalizeExtracted(data) {
  const person_name = String(data?.person_name ?? '').trim()
  const amount = Number(data?.amount)
  const currency = String(data?.currency ?? 'VND').trim() || 'VND'
  const action = String(data?.action ?? '').trim().toLowerCase()
  const reason = String(data?.reason ?? '').trim()

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
      }

      if (!sourceText) {
        return jsonResponse({ error: 'No text to process.' }, 400)
      }

      const data = await extractDebtData(groq, sourceText)

      return jsonResponse({ success: true, data })
    } catch (err) {
      console.error('[api/debt]', err)

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
