import {
  Plus,
  Search,
  Link2,
  Calendar,
  Timer,
  Check,
  RotateCcw,
  Pencil,
  Trash2,
  LoaderCircle,
  FolderOpen,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  parseTransactionFilters,
  buildTransactionSearchParams,
} from '../lib/transactionFilters'
import { formatVND, isSettled } from '../lib/format'

export default function TransactionLedger({
  debts,
  masterDebts,
  loading,
  editingId,
  onOpenAdd,
  onTogglePaid,
  onEdit,
  onDelete,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { accountId, time: monthFilter, status: statusFilter, q: searchQuery } =
    parseTransactionFilters(searchParams)

  function updateFilters(patch) {
    const next = {
      accountId,
      time: monthFilter,
      status: statusFilter,
      q: searchQuery,
      ...patch,
    }
    setSearchParams(buildTransactionSearchParams(next), { replace: true })
  }

  const filteredAccount = accountId
    ? masterDebts.find((md) => String(md.id) === String(accountId))
    : null

  const uniqueMonths = [
    ...new Set(
      debts.map((debt) => {
        const dateStr =
          debt.transaction_date || debt.created_at.split('T')[0]
        return dateStr.substring(0, 7)
      }),
    ),
  ]
    .sort()
    .reverse()

  let totalReceivables = 0
  let totalLiabilities = 0

  const filteredDebts = debts.filter((debt) => {
    const dMonth = (
      debt.transaction_date || debt.created_at.split('T')[0]
    ).substring(0, 7)
    const matchesMonth = monthFilter === 'all' || dMonth === monthFilter
    const noteText = debt.notes ? debt.notes.toLowerCase() : ''
    const personText = debt.person ? debt.person.toLowerCase() : ''
    let accountNameText = ''
    if (debt.account_id) {
      const linkedAcc = masterDebts.find((md) => md.id == debt.account_id)
      if (linkedAcc) accountNameText = linkedAcc.name.toLowerCase()
    }
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      personText.includes(q) ||
      noteText.includes(q) ||
      accountNameText.includes(q)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !isSettled(debt.paid)) ||
      (statusFilter === 'settled' && isSettled(debt.paid))
    const matchesAccount =
      !accountId || String(debt.account_id) === String(accountId)
    return matchesMonth && matchesSearch && matchesStatus && matchesAccount
  })

  filteredDebts.forEach((debt) => {
    if (!isSettled(debt.paid)) {
      if (debt.type === 'owed') totalReceivables += Number(debt.amount)
      if (debt.type === 'owe') totalLiabilities += Number(debt.amount)
    }
  })

  const net = totalReceivables - totalLiabilities
  const periodText =
    monthFilter === 'all'
      ? '(All Time)'
      : (() => {
          const [year, month] = monthFilter.split('-')
          return `(${month}/${year})`
        })()

  const netClass =
    net > 0
      ? 'text-brand-positive drop-shadow-sm'
      : net < 0
        ? 'text-brand-negative drop-shadow-sm'
        : 'text-neu-textMain dark:text-darkNeu-textMain'

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-neu-surface dark:bg-darkNeu-surface p-8 rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop flex flex-col justify-center">
          <p className="text-sm font-semibold text-neu-textMuted mb-2">
            Net Position{' '}
            <span className="period-label font-normal text-xs ml-1 opacity-70">
              {periodText}
            </span>
          </p>
          <h2 className={`text-3xl font-bold tracking-tight ${netClass}`}>
            {formatVND(net)}
          </h2>
        </div>
        <div className="bg-neu-surface dark:bg-darkNeu-surface p-8 rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-2 h-full bg-brand-positive/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <p className="text-sm font-semibold text-neu-textMuted mb-2">
            Receivables{' '}
            <span className="period-label font-normal text-xs ml-1 opacity-70">
              {periodText}
            </span>
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-brand-positive drop-shadow-sm">
            {formatVND(totalReceivables)}
          </h2>
        </div>
        <div className="bg-neu-surface dark:bg-darkNeu-surface p-8 rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-2 h-full bg-brand-negative/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <p className="text-sm font-semibold text-neu-textMuted mb-2">
            Liabilities{' '}
            <span className="period-label font-normal text-xs ml-1 opacity-70">
              {periodText}
            </span>
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-brand-negative drop-shadow-sm">
            {formatVND(totalLiabilities)}
          </h2>
        </div>
      </div>

      <div className="bg-neu-surface dark:bg-darkNeu-surface p-6 md:p-8 rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop flex flex-col">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-6 mb-2 gap-6 shrink-0">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-neu-textMain dark:text-darkNeu-textMain">
              Transactions Ledger
            </h3>
            {accountId ? (
              <div className="flex items-center gap-3 text-xs font-medium text-neu-textMuted dark:text-darkNeu-textMuted">
                <span>
                  {filteredAccount
                    ? `Filtered by account: ${filteredAccount.name}`
                    : 'Account not found'}
                </span>
                <button
                  type="button"
                  onClick={() => updateFilters({ accountId: null })}
                  className="underline hover:opacity-80"
                >
                  Clear
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button
              type="button"
              onClick={onOpenAdd}
              className="px-5 py-3 bg-neu-primary text-white shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-xs font-bold rounded-neu-md transition-all-custom flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>

            <select
              value={monthFilter}
              onChange={(e) => updateFilters({ time: e.target.value })}
              className="bg-neu-surface dark:bg-darkNeu-surface shadow-neu-inner dark:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3 text-xs outline-none font-bold border-none appearance-none cursor-pointer pr-8 relative"
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
              value={statusFilter}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="bg-neu-surface dark:bg-darkNeu-surface shadow-neu-inner dark:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3 text-xs outline-none font-bold border-none appearance-none cursor-pointer pr-8 relative"
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
                value={searchQuery}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="Search..."
                className="w-full sm:w-48 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-inner dark:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3 pl-10 text-xs outline-none border-none placeholder:text-neu-textMuted/50 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="text-neu-textMuted text-[11px] uppercase tracking-widest font-bold">
                <th className="px-4 py-4 w-36">Status / Date</th>
                <th className="px-4 py-4">Entity</th>
                <th className="px-4 py-4">Link to Account</th>
                <th className="px-4 py-4">Details</th>
                <th className="px-4 py-4 text-right">Amount (VNĐ)</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            {!loading && filteredDebts.length > 0 ? (
              <tbody className="text-sm">
                {filteredDebts.map((debt) => {
                  const settled = isSettled(debt.paid)
                  const isEditing = editingId === debt.id
                  const badgeColor = settled
                    ? 'text-neu-textMuted'
                    : debt.type === 'owed'
                      ? 'text-brand-positive drop-shadow-sm'
                      : 'text-brand-negative drop-shadow-sm'
                  const statusLabel = settled
                    ? 'Settled'
                    : debt.type === 'owed'
                      ? 'Owed to Me'
                      : 'I Owe'
                  const amountColor = settled
                    ? 'text-neu-textMuted line-through'
                    : debt.type === 'owed'
                      ? 'text-brand-positive'
                      : 'text-brand-negative'
                  const displayDate =
                    debt.transaction_date || debt.created_at.split('T')[0]
                  const amountDisplay =
                    (debt.type === 'owe' && !settled
                      ? '-'
                      : debt.type === 'owed' && !settled
                        ? '+'
                        : '') + formatVND(Number(debt.amount))

                  const linkedAcc = debt.account_id
                    ? masterDebts.find((md) => md.id == debt.account_id)
                    : null

                  return (
                    <tr
                      key={debt.id}
                      className={`group rounded-neu-md overflow-hidden my-3 table-row ${
                        settled
                          ? 'opacity-60 shadow-neu-inner dark:shadow-neu-dark-inner'
                          : 'shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm bg-neu-surface dark:bg-darkNeu-surface'
                      } ${isEditing ? 'ring-2 ring-neu-primary/20' : ''}`}
                    >
                      <td className="p-4 rounded-l-neu-md">
                        <div className="flex flex-col items-start gap-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${badgeColor}`}
                          >
                            {statusLabel}
                          </span>
                          <span className="text-xs text-neu-textMuted font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {displayDate}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`p-4 font-bold text-neu-textMain dark:text-darkNeu-textMain text-base ${settled ? 'line-through' : ''}`}
                      >
                        {debt.person}
                      </td>
                      <td className="p-4 align-middle whitespace-nowrap">
                        {linkedAcc ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner text-[10px] font-bold uppercase tracking-wider text-neu-textMain dark:text-darkNeu-textMain">
                            <Link2 className="w-3 h-3 text-neu-textMuted" />
                            <span className="truncate max-w-[120px]">
                              {linkedAcc.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-neu-textMuted/50">-</span>
                        )}
                      </td>
                      <td className="p-4 text-neu-textMuted">
                        <div
                          className={`truncate max-w-[180px] text-sm font-medium ${settled ? 'line-through' : ''}`}
                        >
                          {debt.notes || '-'}
                        </div>
                        {debt.due_date ? (
                          <div
                            className={`text-[10px] text-brand-warning mt-1 font-bold uppercase tracking-wider flex items-center gap-1 ${settled ? 'line-through' : ''}`}
                          >
                            <Timer className="w-3 h-3" />
                            Due: {debt.due_date}
                          </div>
                        ) : null}
                      </td>
                      <td
                        className={`p-4 font-black text-right text-base tracking-tight ${amountColor}`}
                      >
                        {amountDisplay}
                      </td>
                      <td className="p-4 text-center space-x-3 whitespace-nowrap rounded-r-neu-md">
                        <button
                          type="button"
                          onClick={() => onTogglePaid(debt.id)}
                          className="w-8 h-8 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMuted hover:text-brand-positive transition inline-flex justify-center items-center"
                          title="Toggle Status"
                        >
                          {settled ? (
                            <RotateCcw className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(debt)}
                          className="w-8 h-8 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMuted hover:text-neu-textMain transition inline-flex justify-center items-center"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(debt.id)}
                          className="w-8 h-8 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMuted hover:text-brand-negative transition inline-flex justify-center items-center"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            ) : null}
          </table>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neu-textMuted">
              <div className="w-12 h-12 rounded-full shadow-neu-inner flex items-center justify-center mb-6">
                <LoaderCircle className="w-5 h-5 animate-spin text-neu-primary dark:text-darkNeu-textMain" />
              </div>
              <p className="font-medium">Syncing database...</p>
            </div>
          ) : null}

          {!loading && filteredDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neu-textMuted">
              <div className="w-20 h-20 rounded-full shadow-neu-inner flex items-center justify-center mb-6 opacity-60">
                <FolderOpen className="w-6 h-6" />
              </div>
              <p className="font-bold">No records found</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
