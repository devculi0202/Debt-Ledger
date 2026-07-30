# Voice / text debt input for Debt Ledger

**Date:** 2026-07-30  
**Status:** Approved for planning  
**Approach:** Hook + presentational UI (`useMediaRecorder`, `useDebtSubmit`, `VoiceDebtInput`) with thin `voiceDebt` service

## Problem

Users currently create debts only through structured modals. A hybrid text/voice chat-style input would let them describe a debt in natural language (typed or spoken) and send it to a backend endpoint that returns structured JSON.

## Goals

- Provide a fixed bottom-right chat bar (above the calculator FAB) with a text field and press-and-hold microphone.
- Record audio with the native browser `MediaRecorder` API (no external audio libraries).
- Submit text as JSON and audio as `FormData` to `POST /api/debt`.
- Expose clear visual states: `idle`, `recording`, `processing`, `error`.
- Handle microphone permission denial gracefully (toast, no crash).
- On success: toast, clear input, call `onSuccess(responseJson)`.

## Non-goals

- Implementing the `/api/debt` backend (speech-to-text, NLP, or persistence).
- Opening create modals or writing to Supabase from this component (parent owns that via `onSuccess`).
- Click-to-toggle recording (press-and-hold only for v1).
- Installing new icon packages (`lucide-react` already available).
- Collapsing the bar into a FAB or refactoring the calculator into a shared dock.

## Decisions (from brainstorming)

| Topic | Choice |
|-------|--------|
| Mic interaction | Press-and-hold; release stops and submits |
| Placement | Right bottom corner, above calculator FAB |
| Success behavior | Toast + clear input + `onSuccess(json)` |
| Idle UI | Always-visible compact bar |
| Structure | Approach 2 — hooks + dumb UI + thin service |

## Architecture

### File layout

```
src/
  hooks/
    useMediaRecorder.js
    useDebtSubmit.js
  components/
    VoiceDebtInput.jsx
  services/
    voiceDebt.js
  App.jsx                    # mount VoiceDebtInput in authenticated shell
```

### Responsibilities

| Unit | Responsibility |
|------|----------------|
| `useMediaRecorder` | `getUserMedia` + `MediaRecorder`; start/stop; return Blob; permission/errors; cleanup on unmount. No UI. |
| `useDebtSubmit` | Submit lifecycle state (`idle` / `processing` / `error`); call service; surface success/failure to the component. |
| `voiceDebt.js` | `submitText(text)` and `submitAudio(blob)` using `fetch` to `/api/debt`. |
| `VoiceDebtInput` | Neumorphic bar UI; wire hooks; Enter to send text; pointer hold/release on mic; toasts; optional `onSuccess`. |

### Component API

```js
<VoiceDebtInput onSuccess={(data) => { /* parent refreshes / opens confirm */ }} />
```

- `onSuccess` is optional; when omitted, success still toasts and clears.
- Mount only in the authenticated app shell (same area as the calculator FAB), not on the login page.

## UI & interaction

### Layout

- Fixed: `bottom-24 right-6`, `z-50` (calculator FAB remains `bottom-6 right-6`).
- Width: approximately `min(22rem, calc(100vw - 3rem))`.
- Styling: existing neumorphic tokens (`bg-neu-surface`, `shadow-neu-drop`, `rounded-neu-md`, dark variants). Reuse `NeuIconButton` patterns where practical.

### Controls

- Text input: placeholder e.g. “Type a debt…”; Enter submits trimmed non-empty text; disabled while `recording` or `processing`.
- Mic button: circular neumorphic control.
  - `pointerdown` → start recording
  - `pointerup` / `pointerleave` / `pointercancel` → stop recording and submit audio
  - `contextmenu` → `preventDefault` (avoid long-press browser menu)
- Icons (lucide-react): `Mic`, `MicOff`, `LoaderCircle`; pulsing red indicator while recording.

### Visual states

| State | Appearance |
|-------|------------|
| `idle` | Normal input + mic |
| `recording` | Pulsing red mic/dot; optional “Recording…” hint |
| `processing` | Spinner; input and mic disabled |
| `error` | Error toast; brief error tint on mic; return to `idle` |

Combined UI state is derived from recorder + submit hooks (recording takes priority over idle; processing after stop until fetch settles).

## Data flow

### Text path

1. User types and presses Enter.
2. `useDebtSubmit` → `voiceDebt.submitText(text)`.
3. `POST /api/debt` with headers `Content-Type: application/json` and body `{ "text": "<user input>" }`.
4. On 2xx: parse JSON → success toast → clear text → `onSuccess(data)`.
5. On failure: error toast → `error` then `idle`.

### Voice path

1. User holds mic → `useMediaRecorder.start()`.
2. User releases → `stop()` resolves to a `Blob`.
3. MIME: prefer `audio/webm` when supported; otherwise browser default (e.g. `audio/mp4`); append as FormData field `"audio"` with a sensible filename (`recording.webm` / `recording.mp4`).
4. `useDebtSubmit` → `voiceDebt.submitAudio(blob)`.
5. Same success/failure handling as text (no text field to clear for pure voice; still toast + `onSuccess`).

### Empty / noop cases

- Empty trimmed text → do not submit.
- Empty or missing blob after stop → do not submit; return to idle.
- Rapid pointer leave before recorder started → ignore safely.

## Error handling

- Microphone permission denied (`NotAllowedError` / equivalent): friendly toast (“Microphone permission is required…”); stay idle.
- `mediaDevices` / `MediaRecorder` unavailable: toast; disable mic or show `MicOff`; text input still works.
- Network / non-OK API response: toast with generic or server message; reset to idle.
- Always stop media tracks and release the recorder on unmount.

## Out of scope / parent contract

The backend may return structured debt fields. `VoiceDebtInput` does not interpret them beyond passing the parsed JSON to `onSuccess`. Wiring refresh, modal prefill, or Supabase writes is a follow-up on the parent.

## Testing / verification

Manual smoke checks:

1. Type text + Enter → request fires; success toast; input clears.
2. Hold/release mic (permission granted) → audio `FormData` POST; success path.
3. Deny microphone → toast; app remains usable for typing.
4. Force API failure → error toast; returns to idle.
5. Light and dark mode; bar sits above calculator FAB without overlap; usable on narrow viewports.

## Dependencies

- No new npm packages.
- Uses existing: React 19, Tailwind v4 neumorphic tokens, `lucide-react`, `useToast`.
