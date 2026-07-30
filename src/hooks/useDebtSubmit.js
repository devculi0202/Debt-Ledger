import { useCallback, useState } from 'react'
import { submitText, submitAudio } from '../services/voiceDebt'
import logger from '../lib/logger'

const CTX = 'useDebtSubmit'

export default function useDebtSubmit() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const run = useCallback(async (fn) => {
    setStatus('processing')
    setError(null)
    try {
      const data = await fn()
      setStatus('idle')
      return data
    } catch (err) {
      const message = err?.message || 'Something went wrong.'
      setError(message)
      setStatus('error')
      logger.error('Debt submit failed', CTX, err)
      // brief error state, then idle for next attempt
      setTimeout(() => {
        setStatus((s) => (s === 'error' ? 'idle' : s))
      }, 0)
      return null
    }
  }, [])

  const submitTextDebt = useCallback(
    (text) => run(() => submitText(text)),
    [run],
  )

  const submitAudioDebt = useCallback(
    (blob) => run(() => submitAudio(blob)),
    [run],
  )

  return {
    status,
    error,
    submitTextDebt,
    submitAudioDebt,
  }
}
