import { ChevronLeft, ChevronRight } from 'lucide-react'
import NeuButton from './NeuButton'

export default function Pagination({ page, totalPages, totalCount, onPageChange }) {
  if (totalCount <= 0 || totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-2 border-t border-neu-textMuted/10">
      <p className="text-xs font-medium text-neu-textMuted">
        Showing page {page} of {totalPages} ({totalCount} total)
      </p>
      <div className="flex items-center gap-3">
        <NeuButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </NeuButton>
        <NeuButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </NeuButton>
      </div>
    </div>
  )
}
