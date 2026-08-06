import { useLocale } from '@/shared/i18n'

export default function EmptyState({ icon: Icon, message }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neu-textMuted">
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-neu-bg dark:bg-white/5 border border-line dark:border-line-dark flex items-center justify-center mb-6 opacity-70">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="font-bold">{message ?? t('common.noRecords')}</p>
    </div>
  )
}
