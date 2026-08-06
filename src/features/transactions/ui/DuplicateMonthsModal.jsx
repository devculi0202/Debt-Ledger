import { useEffect, useMemo, useState } from 'react'
import { Copy, X, LoaderCircle, AlertTriangle } from 'lucide-react'
import { formatVND } from '@/shared/lib/format'
import {
  getSourceMonthNumber,
  buildDuplicatePayloads,
  findMonthConflicts,
} from '@/entities/transaction/duplicateTransactionMonths'
import { useLocale } from '@/shared/i18n'

const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function DuplicateMonthsModal({
  open,
  sourceDebt,
  existingDebts = [],
  masterDebts = [],
  onClose,
  onSubmit,
}) {
  const { t } = useLocale()
  const [selectedMonths, setSelectedMonths] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)

  const sourceMonth = sourceDebt ? getSourceMonthNumber(sourceDebt) : 1

  useEffect(() => {
    if (!open || !sourceDebt) return
    setSelectedMonths(new Set())
  }, [open, sourceDebt])

  const preview = useMemo(() => {
    if (!sourceDebt) return []
    const months = [...selectedMonths].filter((m) => m !== sourceMonth)
    return buildDuplicatePayloads(sourceDebt, months)
  }, [sourceDebt, selectedMonths, sourceMonth])

  const conflicts = useMemo(() => {
    if (!sourceDebt) return []
    const months = [...selectedMonths].filter((m) => m !== sourceMonth)
    return findMonthConflicts(existingDebts, sourceDebt, months)
  }, [sourceDebt, existingDebts, selectedMonths, sourceMonth])

  if (!open || !sourceDebt) return null

  const linkedAcc = sourceDebt.account_id
    ? masterDebts.find((md) => String(md.id) === String(sourceDebt.account_id))
    : null

  const targetCount = preview.length

  function toggleMonth(month) {
    if (month === sourceMonth) return
    setSelectedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  function selectAll() {
    setSelectedMonths(new Set(ALL_MONTHS.filter((m) => m !== sourceMonth)))
  }

  function clearAll() {
    setSelectedMonths(new Set())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (targetCount === 0) return
    setSubmitting(true)
    try {
      await onSubmit(preview.map((p) => p.payload))
    } finally {
      setSubmitting(false)
    }
  }

  const previewKey =
    targetCount === 1 ? 'transactions.preview' : 'transactions.previewPlural'
  const createKey =
    targetCount === 1
      ? 'transactions.createRecords'
      : 'transactions.createRecordsPlural'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neu-bg/80 dark:bg-darkNeu-bg/80 backdrop-blur-md transition-opacity px-4">
      <div className="bg-neu-surface dark:bg-darkNeu-surface w-full max-w-lg rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop p-6 transform transition-all max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner flex items-center justify-center">
              <Copy className="w-3.5 h-3.5 text-neu-primary dark:text-darkNeu-textMain" />
            </div>
            {t('transactions.duplicateTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neu-textMuted hover:text-brand-negative transition w-8 h-8 flex items-center justify-center rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-5 p-3 rounded-neu-md shadow-neu-inner dark:shadow-neu-dark-inner text-sm space-y-1">
          <div className="font-bold text-neu-textMain dark:text-darkNeu-textMain">
            {sourceDebt.person}
          </div>
          <div className="text-neu-textMuted">
            {formatVND(Number(sourceDebt.amount))}
            {linkedAcc ? ` · ${linkedAcc.name}` : ''}
          </div>
          <div className="text-xs text-neu-textMuted">
            {t('transactions.source', {
              month: sourceMonth,
              notes: sourceDebt.notes || t('transactions.noNotes'),
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neu-textMuted pl-1">
                {t('transactions.selectMonths')}
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-neu-primary hover:underline font-medium"
                >
                  {t('transactions.selectAll')}
                </button>
                <span className="text-neu-textMuted">·</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-neu-textMuted hover:underline font-medium"
                >
                  {t('common.clear')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ALL_MONTHS.map((month) => {
                const isSource = month === sourceMonth
                return (
                  <button
                    key={month}
                    type="button"
                    disabled={isSource}
                    onClick={() => toggleMonth(month)}
                    title={
                      isSource ? t('transactions.sourceMonthTitle') : undefined
                    }
                    className={`py-2 rounded-neu-md text-xs font-bold transition-all-custom ${
                      isSource
                        ? 'shadow-neu-inner dark:shadow-neu-dark-inner text-neu-textMuted cursor-not-allowed opacity-60'
                        : selectedMonths.has(month)
                          ? 'shadow-neu-inner dark:shadow-neu-dark-inner text-neu-primary'
                          : 'shadow-neu-drop dark:shadow-neu-dark-drop text-neu-textMuted hover:text-neu-textMain'
                    }`}
                  >
                    T{month}
                    {isSource && (
                      <span className="block text-[8px] font-normal normal-case">
                        {t('transactions.sourceMonth')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="flex gap-2 p-3 rounded-neu-md bg-brand-warning/10 text-brand-warning text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {t('transactions.conflictWarning', {
                  months: conflicts.join(', T'),
                })}
              </span>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neu-textMuted mb-2 pl-1">
                {t(previewKey, { count: targetCount })}
              </label>
              <div className="max-h-40 overflow-y-auto rounded-neu-md shadow-neu-inner dark:shadow-neu-dark-inner">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-neu-textMuted uppercase tracking-wider text-[10px]">
                      <th className="px-3 py-2 text-left">
                        {t('transactions.month')}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t('transactions.dueCol')}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t('transactions.notesCol')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(({ month, payload }) => (
                      <tr
                        key={month}
                        className="border-t border-neu-bg/50 dark:border-darkNeu-bg/50"
                      >
                        <td className="px-3 py-2 font-bold">T{month}</td>
                        <td className="px-3 py-2 text-neu-textMuted">
                          {payload.due_date}
                        </td>
                        <td className="px-3 py-2 text-neu-textMuted truncate max-w-[180px]">
                          {payload.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMain dark:text-darkNeu-textMain font-semibold rounded-neu-md transition-all-custom"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || targetCount === 0}
              className="flex-1 px-4 py-3 bg-neu-primary text-white shadow-neu-drop dark:shadow-neu-dark-drop font-semibold rounded-neu-md hover:opacity-90 active:shadow-neu-inner transition-all-custom flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                t(createKey, { count: targetCount })
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
