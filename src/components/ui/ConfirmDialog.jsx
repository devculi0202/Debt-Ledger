import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neu-bg/80 dark:bg-darkNeu-bg/80 backdrop-blur-md px-4">
      <div className="bg-neu-surface dark:bg-darkNeu-surface w-full max-w-sm rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner flex items-center justify-center text-brand-warning shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neu-textMain dark:text-darkNeu-textMain">
            {title}
          </h3>
        </div>
        <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted">
          {message}
        </p>
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMain dark:text-darkNeu-textMain font-semibold rounded-neu-md transition-all-custom"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-brand-negative text-white shadow-neu-drop dark:shadow-neu-dark-drop font-semibold rounded-neu-md hover:opacity-90 active:shadow-neu-inner transition-all-custom"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
