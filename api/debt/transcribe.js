import { WHISPER_MODEL } from './groq.js'

export async function transcribeAudio(groq, audioFile) {
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
