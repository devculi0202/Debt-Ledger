import { ChevronLeft, ChevronRight } from 'lucide-react'
import NeuButton from './NeuButton'
import { useLocale } from '@/shared/i18n'

export default function Pagination({ page, totalPages, totalCount, onPageChange }) {
  const { t } = useLocale()
  if (totalCount <= 0 || totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-2 border-t border-line dark:border-line-dark">
      <p className="text-xs font-medium text-neu-textMuted">
        {t('common.showingPage', { page, totalPages, totalCount })}
      </p>
      <div className="flex items-center gap-3">
        <NeuButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('common.prev')}
        </NeuButton>
        <NeuButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('common.next')}
          <ChevronRight className="w-4 h-4" />
        </NeuButton>
      </div>
    </div>
  )
}
