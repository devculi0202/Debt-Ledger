import {
  VOICE_EXTRACT_SYSTEM_PROMPT,
  normalizeExtracted,
} from '../../packages/domain/src/index.js'
import { EXTRACT_MODEL } from './groq.js'

export async function extractDebtData(groq, sourceText) {
  const completion = await groq.chat.completions.create({
    model: EXTRACT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: VOICE_EXTRACT_SYSTEM_PROMPT },
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
