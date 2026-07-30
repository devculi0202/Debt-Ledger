import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, LoaderCircle } from 'lucide-react'
import useMediaRecorder from '../hooks/useMediaRecorder'
import useDebtSubmit from '../hooks/useDebtSubmit'
import { useToast } from './ui/Toast'

export default function VoiceDebtInput({ onSuccess }) {
  const [text, setText] = useState('')
  const toast = useToast()
  const { isRecording, isSupported, error: recorderError, start, stop } =
    useMediaRecorder()
  const { status, error: submitError, submitTextDebt, submitAudioDebt } =
    useDebtSubmit()
  const holdingRef = useRef(false)

  const isProcessing = status === 'processing'
  const hasError = status === 'error' || !!recorderError
  const disabled = isRecording || isProcessing

  useEffect(() => {
    if (recorderError) toast.error(recorderError)
  }, [recorderError, toast])

  useEffect(() => {
    if (submitError) toast.error(submitError)
  }, [submitError, toast])

  const handleTextSubmit = async (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value || disabled) return

    const data = await submitTextDebt(value)
    if (data != null) {
      toast.success('Debt submitted.')
      setText('')
      onSuccess?.(data)
    }
  }

  const handlePointerDown = async (e) => {
    if (!isSupported || isProcessing) return
    e.preventDefault()
    holdingRef.current = true
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* ignore */
    }
    await start()
    // User released before getUserMedia / recorder finished starting
    if (!holdingRef.current) {
      await stop()
    }
  }

  const handlePointerEnd = async () => {
    if (!holdingRef.current && !isRecording) return
    holdingRef.current = false
    const blob = await stop()
    if (!blob) return

    const data = await submitAudioDebt(blob)
    if (data != null) {
      toast.success('Voice debt submitted.')
      onSuccess?.(data)
    }
  }

  return (
    <div
      className="fixed bottom-24 right-6 z-50 w-[min(22rem,calc(100vw-3rem))]"
      role="region"
      aria-label="Voice and text debt input"
    >
      <form
        onSubmit={handleTextSubmit}
        className="flex items-center gap-2 bg-neu-surface dark:bg-darkNeu-surface rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop p-2 pl-3"
      >
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            placeholder={isRecording ? 'Recording…' : 'Type a debt…'}
            className="w-full bg-transparent outline-none text-sm text-neu-textMain dark:text-darkNeu-textMain placeholder:text-neu-textMuted disabled:opacity-60"
            aria-label="Debt text input"
          />
          {isRecording ? (
            <span
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-negative animate-pulse"
              aria-hidden
            />
          ) : null}
        </div>

        <button
          type="button"
          disabled={isProcessing || !isSupported}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={
            !isSupported
              ? 'Microphone not supported'
              : isRecording
                ? 'Recording — release to send'
                : 'Hold to record voice debt'
          }
          className={`relative w-10 h-10 shrink-0 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner inline-flex justify-center items-center transition-all-custom select-none touch-none ${
            isRecording
              ? 'text-brand-negative'
              : hasError
                ? 'text-brand-negative'
                : 'text-neu-textMuted'
          } disabled:opacity-50`}
        >
          {isProcessing ? (
            <LoaderCircle className="w-5 h-5 animate-spin" />
          ) : !isSupported ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <>
              <Mic className="w-5 h-5" />
              {isRecording ? (
                <span
                  className="absolute inset-0 rounded-full ring-2 ring-brand-negative/60 animate-pulse"
                  aria-hidden
                />
              ) : null}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
