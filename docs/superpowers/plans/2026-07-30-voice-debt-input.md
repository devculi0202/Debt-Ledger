# Voice / Text Debt Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed bottom-right hybrid text/voice chat bar that POSTs typed text or recorded audio to `/api/debt`, with press-and-hold mic, visual states, and toast feedback.

**Architecture:** Thin `voiceDebt` service for `fetch`. `useMediaRecorder` owns getUserMedia + MediaRecorder lifecycle and Blob output. `useDebtSubmit` owns processing/error submit state. Presentational `VoiceDebtInput` wires both hooks and mounts in `AuthenticatedShell` above the calculator FAB.

**Tech Stack:** React 19, Vite 8, Tailwind v4 neumorphic tokens, lucide-react, native MediaRecorder / fetch. No new npm packages.

**Spec:** `docs/superpowers/specs/2026-07-30-voice-debt-input-design.md`

## Global Constraints

- No external audio libraries; use native `MediaRecorder` + `getUserMedia` only.
- Mic interaction is press-and-hold only (pointer down start, pointer up/leave/cancel stop + submit).
- `POST /api/debt`: JSON `{ text }` for typed input; `FormData` field `"audio"` for recordings.
- Visual states: `idle`, `recording`, `processing`, `error`.
- Success: toast + clear text input + optional `onSuccess(json)`.
- Mic permission denied: friendly toast; stay idle; text input still works.
- No new icon packages — use existing `lucide-react`.
- Do not implement the `/api/debt` backend; do not write to Supabase from this feature.
- Place bar at `fixed bottom-24 right-6 z-50` above calculator FAB (`bottom-6 right-6`).
- No automated test suite in this repo; verify with the manual checklist in each task.
- Commit only if the user asked to commit (or when executing a plan step that includes commit and the user already approved plan execution that includes commits).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/services/voiceDebt.js` | `submitText` / `submitAudio` fetch wrappers to `/api/debt` |
| `src/hooks/useMediaRecorder.js` | Permission, record start/stop, Blob, cleanup, recorder errors |
| `src/hooks/useDebtSubmit.js` | Submit state machine; calls `voiceDebt` |
| `src/components/VoiceDebtInput.jsx` | Neumorphic bar UI; wires hooks; toasts; `onSuccess` |
| `src/App.jsx` | Mount `<VoiceDebtInput />` in `AuthenticatedShell` |

---

### Task 1: Create `voiceDebt` service

**Files:**
- Create: `src/services/voiceDebt.js`

**Interfaces:**
- Consumes: `fetch`, `logger`
- Produces:
  - `submitText(text: string): Promise<unknown>` — POST JSON `{ text }`
  - `submitAudio(blob: Blob): Promise<unknown>` — POST FormData with `"audio"`
  - Both throw `Error` with a user-facing message on non-OK responses or network failure
  - Both return parsed JSON body on success (empty object if body is empty)

- [ ] **Step 1: Create the service file**

Create `src/services/voiceDebt.js`:

```js
import logger from '../lib/logger'

const CTX = 'voiceDebt'
const ENDPOINT = '/api/debt'

async function parseResponse(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function handleResponse(res) {
  const data = await parseResponse(res)
  if (!res.ok) {
    const message =
      (typeof data === 'object' && data && (data.message || data.error)) ||
      `Request failed (${res.status})`
    const err = new Error(typeof message === 'string' ? message : 'Request failed')
    logger.error('submit failed', CTX, { status: res.status, data })
    throw err
  }
  return data
}

export const submitText = async (text) => {
  logger.info('Submitting text debt', CTX)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    return await handleResponse(res)
  } catch (err) {
    if (err instanceof TypeError) {
      logger.error('Network error submitting text', CTX, err)
      throw new Error('Could not reach the server. Please try again.')
    }
    throw err
  }
}

export const submitAudio = async (blob) => {
  const mime = blob.type || 'audio/webm'
  const ext = mime.includes('mp4') ? 'mp4' : 'webm'
  const form = new FormData()
  form.append('audio', blob, `recording.${ext}`)

  logger.info('Submitting audio debt', CTX, { type: mime, size: blob.size })
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      body: form,
    })
    return await handleResponse(res)
  } catch (err) {
    if (err instanceof TypeError) {
      logger.error('Network error submitting audio', CTX, err)
      throw new Error('Could not reach the server. Please try again.')
    }
    throw err
  }
}
```

- [ ] **Step 2: Sanity-check the module loads**

Run from project root:

```bash
node --input-type=module -e "import('./src/services/voiceDebt.js').then(m => console.log(Object.keys(m))).catch(e => { console.error(e); process.exit(1) })"
```

Expected: prints something including `submitText` and `submitAudio` (Vite-only env in logger is fine; if import fails solely due to `import.meta.env`, skip this check and rely on Step 3).

Alternate if Node cannot resolve `import.meta.env`:

```bash
npm run lint
```

Expected: no new lint errors for `src/services/voiceDebt.js`.

- [ ] **Step 3: Commit** (only if the user asked to commit)

```bash
git add src/services/voiceDebt.js
git commit -m "feat: add voiceDebt API service for text and audio POST"
```

---

### Task 2: Create `useMediaRecorder` hook

**Files:**
- Create: `src/hooks/useMediaRecorder.js`

**Interfaces:**
- Consumes: browser `navigator.mediaDevices`, `MediaRecorder`
- Produces hook return:
  - `isRecording: boolean`
  - `isSupported: boolean` — false when MediaRecorder / getUserMedia missing
  - `error: string | null` — last recorder/permission error message (cleared on next successful start)
  - `start(): Promise<void>`
  - `stop(): Promise<Blob | null>` — resolves with audio Blob, or `null` if nothing useful was captured
  - Cleanup on unmount: stop tracks, release recorder

- [ ] **Step 1: Create the hook**

Create `src/hooks/useMediaRecorder.js`:

```js
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

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const resetRecorder = useCallback(() => {
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopPromiseRef.current = null
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

    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
        releaseStream()
        resetRecorder()
      }

      recorder.start()
      setIsRecording(true)
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
      recorder.onstop = () => {
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
          resolve(null)
          return
        }
        logger.debug('Recording stopped', CTX, { size: blob.size, type: blob.type })
        resolve(blob)
      }

      try {
        recorder.stop()
      } catch (err) {
        logger.warn('stop() failed', CTX, err)
        setIsRecording(false)
        releaseStream()
        resetRecorder()
        resolve(null)
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
```

- [ ] **Step 2: Lint the new hook**

Run:

```bash
npm run lint
```

Expected: exit 0, or no new errors attributed to `src/hooks/useMediaRecorder.js`.

- [ ] **Step 3: Commit** (only if the user asked to commit)

```bash
git add src/hooks/useMediaRecorder.js
git commit -m "feat: add useMediaRecorder hook for press-and-hold capture"
```

---

### Task 3: Create `useDebtSubmit` hook

**Files:**
- Create: `src/hooks/useDebtSubmit.js`

**Interfaces:**
- Consumes: `submitText`, `submitAudio` from `../services/voiceDebt`
- Produces hook return:
  - `status: 'idle' | 'processing' | 'error'`
  - `error: string | null`
  - `submitTextDebt(text: string): Promise<unknown | null>`
  - `submitAudioDebt(blob: Blob): Promise<unknown | null>`
  - Returns parsed JSON on success; returns `null` on failure (error message in `error`)

- [ ] **Step 1: Create the hook**

Create `src/hooks/useDebtSubmit.js`:

```js
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
```

- [ ] **Step 2: Lint**

Run:

```bash
npm run lint
```

Expected: no new errors for `src/hooks/useDebtSubmit.js`.

- [ ] **Step 3: Commit** (only if the user asked to commit)

```bash
git add src/hooks/useDebtSubmit.js
git commit -m "feat: add useDebtSubmit hook for /api/debt submissions"
```

---

### Task 4: Create `VoiceDebtInput` component

**Files:**
- Create: `src/components/VoiceDebtInput.jsx`

**Interfaces:**
- Consumes: `useMediaRecorder`, `useDebtSubmit`, `useToast`, lucide icons
- Produces: default export `VoiceDebtInput({ onSuccess })`
  - `onSuccess?: (data: unknown) => void`
  - Fixed neumorphic bar; Enter submits text; mic press-and-hold records

- [ ] **Step 1: Create the component**

Create `src/components/VoiceDebtInput.jsx`:

```jsx
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
```

- [ ] **Step 2: Lint**

Run:

```bash
npm run lint
```

Expected: no new errors for `src/components/VoiceDebtInput.jsx`.

- [ ] **Step 3: Commit** (only if the user asked to commit)

```bash
git add src/components/VoiceDebtInput.jsx
git commit -m "feat: add VoiceDebtInput chat bar UI"
```

---

### Task 5: Mount in `AuthenticatedShell` and verify

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `VoiceDebtInput` default export
- Produces: bar visible on authenticated routes only; `onSuccess` logs for now (parent wiring to modals is out of scope)

- [ ] **Step 1: Import and render `VoiceDebtInput`**

In `src/App.jsx`:

1. Add import near other component imports:

```jsx
import VoiceDebtInput from './components/VoiceDebtInput'
```

2. Inside `AuthenticatedShell`, immediately **above** the Calculator FAB block, add:

```jsx
      <VoiceDebtInput
        onSuccess={(data) => {
          // Parent may refresh lists or open a confirm modal later
          console.debug('[VoiceDebtInput] success', data)
        }}
      />
```

Place it so the structure looks like:

```jsx
      <VoiceDebtInput
        onSuccess={(data) => {
          console.debug('[VoiceDebtInput] success', data)
        }}
      />

      {/* Calculator FAB */}
      {!calcOpen && (
        <button
          type="button"
          onClick={() => setCalcOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-neu-primary text-white shadow-neu-drop dark:shadow-neu-dark-drop flex items-center justify-center hover:opacity-90 active:shadow-neu-inner transition-all-custom"
          aria-label="Open calculator"
        >
          <CalcIcon className="w-6 h-6" />
        </button>
      )}

      <Calculator open={calcOpen} onClose={() => setCalcOpen(false)} />
```

Do not mount on `LoginPage`.

- [ ] **Step 2: Run the app and manual smoke checks**

```bash
npm run dev
```

Manual checklist (authenticated session required):

1. Bar appears bottom-right **above** the calculator FAB; does not cover it.
2. Type text + Enter → Network tab shows `POST /api/debt` with JSON `{ text: "..." }` (will fail if no backend — expect error toast, then idle; that is OK).
3. Hold mic (allow permission) → release → Network shows `POST /api/debt` multipart with `audio` field (or error toast if no backend).
4. Deny mic permission → error toast; typing still works.
5. Light and dark theme both look neumorphic and readable.
6. Login page does **not** show the bar.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: exit 0.

- [ ] **Step 4: Commit** (only if the user asked to commit)

```bash
git add src/App.jsx src/services/voiceDebt.js src/hooks/useMediaRecorder.js src/hooks/useDebtSubmit.js src/components/VoiceDebtInput.jsx
git commit -m "feat: mount voice/text debt input above calculator FAB"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Press-and-hold mic | Task 4 (`pointerdown` / `pointerup` / leave / cancel) |
| MediaRecorder, webm/mp4 Blob | Task 2 + Task 1 FormData filename |
| POST JSON `{ text }` | Task 1 `submitText` + Task 4 Enter |
| POST FormData `"audio"` | Task 1 `submitAudio` + Task 4 release |
| States idle/recording/processing/error | Tasks 2–4 |
| Mic permission denied toast | Tasks 2 + 4 |
| Success toast + clear + `onSuccess` | Task 4 |
| Always-visible bar above calc FAB | Tasks 4–5 |
| Hook + dumb UI + service | Tasks 1–4 |
| No backend / no Supabase write | Global constraints + Task 5 console.debug only |
| lucide-react only | Task 4 imports |

**Type consistency:** `submitText` / `submitAudio` (service) ↔ `submitTextDebt` / `submitAudioDebt` (hook) ↔ component calls. Hook `status` values `'idle' | 'processing' | 'error'`. Recorder `stop()` → `Blob | null`.
