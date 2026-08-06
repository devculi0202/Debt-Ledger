import { useCallback, useEffect, useRef, useState } from 'react'
import { submitText, submitAudio } from '../api/voiceDebt'
import logger from '@/shared/lib/logger'

const CTX = 'useDebtSubmit'

export default function useDebtSubmit() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const errorResetTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (errorResetTimerRef.current != null) {
        clearTimeout(errorResetTimerRef.current)
      }
    }
  }, [])

  const run = useCallback(async (fn) => {
    if (errorResetTimerRef.current != null) {
      clearTimeout(errorResetTimerRef.current)
      errorResetTimerRef.current = null
    }

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
      // Brief error state for UI tint, then idle for the next attempt
      errorResetTimerRef.current = setTimeout(() => {
        errorResetTimerRef.current = null
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
