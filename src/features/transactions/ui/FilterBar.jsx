import { Plus, Search } from 'lucide-react'
import NeuButton from '@/shared/ui/NeuButton'

export default function FilterBar({
  filters,
  filteredAccount,
  uniqueMonths,
  onUpdateFilters,
  onOpenAdd,
}) {
  const selectClass =
    'bg-neu-surface dark:bg-darkNeu-surface shadow-neu-inner dark:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3 text-xs outline-none font-bold border-none appearance-none cursor-pointer pr-8 relative'

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-6 mb-2 gap-6 shrink-0">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-neu-textMain dark:text-darkNeu-textMain">
          Transactions
        </h3>
        <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted max-w-xl">
          Each payment or IOU. Link to a debt account when it belongs to a
          larger loan; leave unlinked for one-off debts.
        </p>
        {filters.accountId ? (
          <div className="flex items-center gap-3 text-xs font-medium text-neu-textMuted dark:text-darkNeu-textMuted">
            <span>
              {filteredAccount
                ? `Filtered by account: ${filteredAccount.name}`
                : 'Account not found'}
            </span>
            <button
              type="button"
              onClick={() => onUpdateFilters({ accountId: null })}
              className="underline hover:opacity-80"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
        <NeuButton variant="primary" onClick={onOpenAdd} className="text-xs py-3 px-5">
          <Plus className="w-3.5 h-3.5" /> Add
        </NeuButton>

        <select
          value={filters.time}
          onChange={(e) => onUpdateFilters({ time: e.target.value })}
          className={selectClass}
        >
          <option value="all">All Time</option>
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
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="settled">Settled Only</option>
        </select>

        <div className="relative flex-1 sm:flex-initial">
          <span className="absolute left-4 top-3 text-neu-textMuted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => onUpdateFilters({ q: e.target.value })}
            placeholder="Search..."
            className="w-full sm:w-48 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-inner dark:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3 pl-10 text-xs outline-none border-none placeholder:text-neu-textMuted/50 font-medium"
          />
        </div>
      </div>
    </div>
  )
}
