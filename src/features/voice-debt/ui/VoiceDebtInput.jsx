import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, LoaderCircle } from 'lucide-react'
import useMediaRecorder from '@/shared/hooks/useMediaRecorder'
import useDebtSubmit from '../hooks/useDebtSubmit'
import { useToast } from '@/shared/ui/Toast'
import { useLocale } from '@/shared/i18n'

export default function VoiceDebtInput({ onSuccess }) {
  const [text, setText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const toast = useToast()
  const { t } = useLocale()
  const { isRecording, isSupported, error: recorderError, start, stop } =
    useMediaRecorder()
  const { status, error: submitError, submitTextDebt, submitAudioDebt } =
    useDebtSubmit()
  const holdingRef = useRef(false)
  const endingRef = useRef(false)
  const inputRef = useRef(null)
  const rootRef = useRef(null)

  const isProcessing = status === 'processing'
  const hasError = status === 'error' || !!recorderError
  const disabled = isRecording || isProcessing

  useEffect(() => {
    if (recorderError) toast.error(recorderError)
  }, [recorderError, toast])

  useEffect(() => {
    if (submitError) toast.error(submitError)
  }, [submitError, toast])

  useEffect(() => {
    if (!expanded) return
    inputRef.current?.focus()
  }, [expanded])

  useEffect(() => {
    if (!expanded) return

    const onPointerDown = (e) => {
      if (isRecording || isProcessing) return
      if (rootRef.current?.contains(e.target)) return
      if (text.trim()) return
      setExpanded(false)
    }

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (isRecording || isProcessing) return
      if (text.trim()) return
      setExpanded(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded, isRecording, isProcessing, text])

  const handleTextSubmit = async (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value || disabled) return

    const data = await submitTextDebt(value)
    if (data != null) {
      setText('')
      setExpanded(false)
      try {
        await onSuccess?.(data)
        toast.success(t('voice.added'))
      } catch {
        toast.error(t('voice.saveFailed'))
      }
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
    if (!holdingRef.current && !endingRef.current) {
      await stop()
    }
  }

  const handlePointerEnd = async () => {
    if (endingRef.current) return
    if (!holdingRef.current && !isRecording) return

    endingRef.current = true
    holdingRef.current = false

    try {
      const blob = await stop()
      if (!blob) return

      const data = await submitAudioDebt(blob)
      if (data != null) {
        setExpanded(false)
        try {
          await onSuccess?.(data)
          toast.success(t('voice.added'))
        } catch {
          toast.error(t('voice.saveFailed'))
        }
      }
    } finally {
      endingRef.current = false
    }
  }

  const micClassName = `relative w-10 h-10 shrink-0 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner inline-flex justify-center items-center transition-all-custom select-none touch-none ${
    isRecording
      ? 'text-brand-negative'
      : hasError
        ? 'text-brand-negative'
        : 'text-neu-textMuted'
  } disabled:opacity-50`

  const micIcon = isProcessing ? (
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
  )

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-24 right-6 z-50 ${
        expanded ? 'w-[min(22rem,calc(100vw-3rem))]' : 'w-auto'
      }`}
      role="region"
      aria-label={t('voice.regionLabel')}
    >
      {expanded ? (
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center gap-2 bg-neu-surface dark:bg-darkNeu-surface rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop p-2 pl-3"
        >
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              placeholder={
                isRecording ? t('voice.recording') : t('voice.placeholder')
              }
              className="w-full bg-transparent outline-none text-sm text-neu-textMain dark:text-darkNeu-textMain placeholder:text-neu-textMuted disabled:opacity-60"
              aria-label={t('voice.inputLabel')}
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
                ? t('voice.micUnsupported')
                : isRecording
                  ? t('voice.recordingRelease')
                  : t('voice.holdToRecord')
            }
            className={micClassName}
          >
            {micIcon}
          </button>
        </form>
      ) : (
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => setExpanded(true)}
          aria-label={t('voice.inputLabel')}
          className={`${micClassName} bg-neu-surface dark:bg-darkNeu-surface`}
        >
          {micIcon}
        </button>
      )}
    </div>
  )
}
