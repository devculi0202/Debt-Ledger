import { useCallback, useEffect, useRef, useState } from 'react'
import logger from '../lib/logger'

const CTX = 'useMediaRecorder'

function pickMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ]
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return ''
  }
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

function permissionMessage(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Microphone permission is required for voice input.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone was found on this device.'
  }
  return err?.message || 'Could not access the microphone.'
}

export default function useMediaRecorder() {
  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'

  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const stopPromiseRef = useRef(null)
  const stopResolveRef = useRef(null)
  const startingRef = useRef(false)
  const startIdRef = useRef(0)

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const resetRecorder = useCallback(() => {
    startIdRef.current += 1
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopPromiseRef.current = null
    stopResolveRef.current = null
    startingRef.current = false
  }, [])

  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      } catch {
        /* ignore */
      }
      releaseStream()
      resetRecorder()
    }
  }, [releaseStream, resetRecorder])

  const start = useCallback(async () => {
    if (!isSupported) {
      const msg = 'Voice recording is not supported in this browser.'
      setError(msg)
      logger.warn(msg, CTX)
      return
    }
    if (mediaRecorderRef.current?.state === 'recording') return
    if (startingRef.current) return

    startingRef.current = true
    setError(null)
    chunksRef.current = []
    const session = startIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (session !== startIdRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        startingRef.current = false
        return
      }
      streamRef.current = stream

      const mimeType = pickMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (event) => {
        const msg = 'Recording failed unexpectedly.'
        setError(msg)
        logger.error(msg, CTX, event.error)
        setIsRecording(false)
        stopResolveRef.current?.(null)
        releaseStream()
        resetRecorder()
      }

      if (session !== startIdRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
        startingRef.current = false
        return
      }

      recorder.start()
      setIsRecording(true)
      startingRef.current = false
      logger.debug('Recording started', CTX, { mimeType: recorder.mimeType })
    } catch (err) {
      const msg = permissionMessage(err)
      setError(msg)
      logger.warn('Failed to start recording', CTX, err)
      releaseStream()
      resetRecorder()
      setIsRecording(false)
    }
  }, [isSupported, releaseStream, resetRecorder])

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false)
      releaseStream()
      resetRecorder()
      return Promise.resolve(null)
    }

    if (stopPromiseRef.current) return stopPromiseRef.current

    stopPromiseRef.current = new Promise((resolve) => {
      stopResolveRef.current = resolve

      recorder.onstop = () => {
        const finish = stopResolveRef.current
        if (!finish) return

        const type = recorder.mimeType || pickMimeType() || 'audio/webm'
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type })
            : null

        setIsRecording(false)
        releaseStream()
        resetRecorder()

        if (!blob || blob.size === 0) {
          logger.debug('Empty recording discarded', CTX)
          finish(null)
          return
        }
        logger.debug('Recording stopped', CTX, { size: blob.size, type: blob.type })
        finish(blob)
      }

      try {
        recorder.stop()
      } catch (err) {
        logger.warn('stop() failed', CTX, err)
        setIsRecording(false)
        stopResolveRef.current?.(null)
        releaseStream()
        resetRecorder()
      }
    })

    return stopPromiseRef.current
  }, [releaseStream, resetRecorder])

  return {
    isRecording,
    isSupported,
    error,
    start,
    stop,
  }
}
