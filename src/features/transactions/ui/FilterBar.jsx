import { Plus, Search } from 'lucide-react'
import NeuButton from '@/shared/ui/NeuButton'
import { useLocale } from '@/shared/i18n'

export default function FilterBar({
  filters,
  filteredAccount,
  uniqueMonths,
  onUpdateFilters,
  onOpenAdd,
}) {
  const { t } = useLocale()
  const selectClass =
    'bg-neu-bg/60 dark:bg-white/5 border border-line dark:border-line-dark text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3 text-xs outline-none font-semibold appearance-none cursor-pointer pr-8 relative focus:border-neu-textMuted/50 transition-all-custom'

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-6 mb-2 gap-6 shrink-0">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-neu-textMain dark:text-darkNeu-textMain tracking-tight">
          {t('transactions.title')}
        </h3>
        <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted max-w-xl">
          {t('transactions.subtitle')}
        </p>
        {filters.accountId ? (
          <div className="flex items-center gap-3 text-xs font-medium text-neu-textMuted dark:text-darkNeu-textMuted">
            <span>
              {filteredAccount
                ? t('transactions.filteredBy', { name: filteredAccount.name })
                : t('transactions.accountNotFound')}
            </span>
            <button
              type="button"
              onClick={() => onUpdateFilters({ accountId: null })}
              className="underline hover:opacity-80 cursor-pointer"
            >
              {t('common.clear')}
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        <NeuButton variant="primary" onClick={onOpenAdd} className="text-xs py-3 px-5">
          <Plus className="w-3.5 h-3.5" /> {t('transactions.add')}
        </NeuButton>

        <select
          value={filters.time}
          onChange={(e) => onUpdateFilters({ time: e.target.value })}
          className={selectClass}
        >
          <option value="all">{t('transactions.allTime')}</option>
          {uniqueMonths.map((monthStr) => {
            const [year, month] = monthStr.split('-')
            return (
              <option key={monthStr} value={monthStr}>
                {month}/{year}
              </option>
            )
          })}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onUpdateFilters({ status: e.target.value })}
          className={selectClass}
        >
          <option value="all">{t('transactions.allStatuses')}</option>
          <option value="active">{t('transactions.activeOnly')}</option>
          <option value="settled">{t('transactions.settledOnly')}</option>
        </select>

        <div className="relative flex-1 sm:flex-initial">
          <span className="absolute left-4 top-3 text-neu-textMuted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => onUpdateFilters({ q: e.target.value })}
            placeholder={t('transactions.search')}
            className="w-full sm:w-48 bg-neu-bg/60 dark:bg-white/5 border border-line dark:border-line-dark text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3 pl-10 text-xs outline-none placeholder:text-neu-textMuted/60 font-medium focus:border-neu-textMuted/50 transition-all-custom"
          />
        </div>
      </div>
    </div>
  )
}
