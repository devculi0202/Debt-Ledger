import { toTransactionPayload } from '../packages/domain/src/index.js'
import { jsonResponse, parseRequestBody } from './debt/parseRequest.js'
import { getGroqClient } from './debt/groq.js'
import { transcribeAudio } from './debt/transcribe.js'
import { extractDebtData } from './debt/extract.js'

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
          {
            error:
              'Provide either JSON body { "text": "..." } or multipart field "audio".',
          },
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
      console.error('[api/debt] error', {
        message: err?.message,
        stack: err?.stack,
      })

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
