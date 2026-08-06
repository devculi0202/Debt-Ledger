import { AlertTriangle } from 'lucide-react'
import { useLocale } from '@/shared/i18n'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  const { t } = useLocale()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-neu-surface dark:bg-darkNeu-surface w-full max-w-sm rounded-neu-lg border border-line dark:border-line-dark shadow-neu-drop dark:shadow-neu-dark-drop p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-warning/10 flex items-center justify-center text-brand-warning shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neu-textMain dark:text-darkNeu-textMain">
            {title}
          </h3>
        </div>
        <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted">
          {message}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-neu-surface dark:bg-darkNeu-surface border border-line dark:border-line-dark text-neu-textMain dark:text-darkNeu-textMain font-semibold rounded-neu-md hover:bg-neu-bg/60 dark:hover:bg-white/5 transition-all-custom cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-brand-negative text-white font-semibold rounded-neu-md hover:opacity-90 active:scale-[0.98] transition-all-custom cursor-pointer"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
