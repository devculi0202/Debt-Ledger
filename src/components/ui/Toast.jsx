import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'text-brand-positive',
  error: 'text-brand-negative',
  warning: 'text-brand-warning',
  info: 'text-neu-primary dark:text-darkNeu-textMain',
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, type, duration) => addToast(message, type, duration),
    [addToast],
  )
  toast.success = (msg, dur) => addToast(msg, 'success', dur)
  toast.error = (msg, dur) => addToast(msg, 'error', dur ?? 6000)
  toast.warning = (msg, dur) => addToast(msg, 'warning', dur)
  toast.info = (msg, dur) => addToast(msg, 'info', dur)

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-6 right-6 z-[80] space-y-3 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info
          return (
            <div
              key={t.id}
              className="pointer-events-auto bg-neu-surface dark:bg-darkNeu-surface rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop p-4 flex items-center gap-3 min-w-[280px] max-w-sm animate-[slideIn_0.3s_ease-out]"
            >
              <Icon className={`w-5 h-5 shrink-0 ${COLORS[t.type]}`} />
              <span className="text-sm font-medium text-neu-textMain dark:text-darkNeu-textMain flex-1">
                {t.message}
              </span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-neu-textMuted hover:text-neu-textMain transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
