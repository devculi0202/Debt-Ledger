import { LoaderCircle } from 'lucide-react'
import { useLocale } from '@/shared/i18n'

export default function LoadingSpinner({ message }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neu-textMuted">
      <div className="w-12 h-12 rounded-full shadow-neu-inner flex items-center justify-center mb-6">
        <LoaderCircle className="w-5 h-5 animate-spin text-neu-primary dark:text-darkNeu-textMain" />
      </div>
      <p className="font-medium">{message ?? t('common.loading')}</p>
    </div>
  )
}
