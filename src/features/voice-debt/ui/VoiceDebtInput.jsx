import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, LoaderCircle, Sparkles, SendHorizontal } from 'lucide-react'
import useMediaRecorder from '@/shared/hooks/useMediaRecorder'
import useDebtSubmit from '../hooks/useDebtSubmit'
import { useToast } from '@/shared/ui/Toast'
import { useLocale } from '@/shared/i18n'

/**
 * Voice/text debt input backed by the Groq flow.
 * variant "fab": floating pill (mobile shell).
 * variant "assistant": embedded AI Assistant card (sidebar).
 */
export default function VoiceDebtInput({ onSuccess, variant = 'fab' }) {
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

  const isAssistant = variant === 'assistant'
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
    if (isAssistant || !expanded) return
    inputRef.current?.focus()
  }, [expanded, isAssistant])

  useEffect(() => {
    if (isAssistant || !expanded) return

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
  }, [expanded, isRecording, isProcessing, text, isAssistant])

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

  const applyChip = (value) => {
    if (disabled) return
    setText(value)
    inputRef.current?.focus()
  }

  const micButtonProps = {
    type: 'button',
    disabled: isProcessing || !isSupported,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerEnd,
    onPointerLeave: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    onContextMenu: (e) => e.preventDefault(),
    'aria-label': !isSupported
      ? t('voice.micUnsupported')
      : isRecording
        ? t('voice.recordingRelease')
        : t('voice.holdToRecord'),
  }

  const micIcon = isProcessing ? (
    <LoaderCircle className="w-4 h-4 animate-spin" />
  ) : !isSupported ? (
    <MicOff className="w-4 h-4" />
  ) : (
    <>
      <Mic className="w-4 h-4" />
      {isRecording ? (
        <span
          className="absolute inset-0 rounded-full ring-2 ring-brand-negative/60 animate-pulse"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (isAssistant) {
    return (
      <div
        ref={rootRef}
        className="assistant-card rounded-neu-lg bg-neu-bg/70 dark:bg-white/5 border border-line dark:border-line-dark p-3 space-y-3"
        role="region"
        aria-label={t('voice.regionLabel')}
      >
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-3.5 h-3.5 text-accent-deep dark:text-accent" />
          <span className="text-xs font-bold text-neu-textMain dark:text-darkNeu-textMain">
            {t('voice.assistantTitle')}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-positive" aria-hidden />
        </div>

        <form
          onSubmit={handleTextSubmit}
          className={`flex items-center gap-1.5 bg-neu-surface dark:bg-darkNeu-surface rounded-full border-2 p-1 pl-3 transition-all-custom ${
            isRecording
              ? 'border-brand-negative/60'
              : hasError
                ? 'border-brand-negative/40'
                : 'border-accent'
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            placeholder={
              isRecording ? t('voice.recording') : t('voice.assistantPlaceholder')
            }
            className="w-full min-w-0 bg-transparent outline-none text-xs text-neu-textMain dark:text-darkNeu-textMain placeholder:text-neu-textMuted disabled:opacity-60"
            aria-label={t('voice.inputLabel')}
          />
          <button
            {...micButtonProps}
            className={`relative w-7 h-7 shrink-0 rounded-full inline-flex justify-center items-center transition-all-custom select-none touch-none cursor-pointer ${
              isRecording || hasError
                ? 'text-brand-negative'
                : 'text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain'
            } disabled:opacity-50`}
          >
            {micIcon}
          </button>
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            aria-label={t('voice.inputLabel')}
            className="w-7 h-7 shrink-0 rounded-full bg-ink text-accent inline-flex justify-center items-center hover:opacity-90 disabled:opacity-40 transition-all-custom cursor-pointer"
          >
            <SendHorizontal className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => applyChip(t('voice.chipOweValue'))}
            className="px-2.5 py-1 rounded-full bg-neu-surface dark:bg-darkNeu-surface border border-line dark:border-line-dark text-[10px] font-semibold text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain transition cursor-pointer"
          >
            {t('voice.chipOwe')}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => applyChip(t('voice.chipOwedValue'))}
            className="px-2.5 py-1 rounded-full bg-neu-surface dark:bg-darkNeu-surface border border-line dark:border-line-dark text-[10px] font-semibold text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain transition cursor-pointer"
          >
            {t('voice.chipOwed')}
          </button>
        </div>
      </div>
    )
  }

  const micClassName = `relative w-10 h-10 shrink-0 rounded-full bg-neu-surface dark:bg-darkNeu-surface border border-line dark:border-line-dark shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm inline-flex justify-center items-center transition-all-custom select-none touch-none cursor-pointer ${
    isRecording || hasError ? 'text-brand-negative' : 'text-neu-textMuted'
  } disabled:opacity-50`

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-24 right-6 z-50 md:hidden ${
        expanded ? 'w-[min(22rem,calc(100vw-3rem))]' : 'w-auto'
      }`}
      role="region"
      aria-label={t('voice.regionLabel')}
    >
      {expanded ? (
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center gap-2 bg-neu-surface dark:bg-darkNeu-surface rounded-full border-2 border-accent shadow-neu-drop dark:shadow-neu-dark-drop p-2 pl-4"
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

          <button {...micButtonProps} className={micClassName}>
            {micIcon}
          </button>
        </form>
      ) : (
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => setExpanded(true)}
          aria-label={t('voice.inputLabel')}
          className={micClassName}
        >
          {micIcon}
        </button>
      )}
    </div>
  )
}
