import Groq from 'groq-sdk'

export const WHISPER_MODEL = 'whisper-large-v3-turbo'
export const EXTRACT_MODEL = 'llama-3.1-8b-instant'

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }
  return new Groq({ apiKey })
}
