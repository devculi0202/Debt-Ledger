import { useSearchParams } from 'react-router-dom'
import {
  parseTransactionFilters,
  buildTransactionSearchParams,
} from '../lib/transactionFilters'
import { formatVND } from '../lib/format'
import {
  getUniqueMonths,
  filterTransactions,
  computeTotals,
} from '../lib/transactionCompute'
import NeuCard from './ui/NeuCard'
import LoadingSpinner from './ui/LoadingSpinner'
import EmptyState from './ui/EmptyState'
import SummaryCards from './transactions/SummaryCards'
import FilterBar from './transactions/FilterBar'
import TransactionTable from './transactions/TransactionTable'
import { FolderOpen } from 'lucide-react'

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
  const filters = parseTransactionFilters(searchParams)

  function updateFilters(patch) {
    const next = { ...filters, ...patch }
    setSearchParams(buildTransactionSearchParams(next), { replace: true })
  }

  const filteredAccount = filters.accountId
    ? masterDebts.find((md) => String(md.id) === String(filters.accountId))
    : null

  const uniqueMonths = getUniqueMonths(debts)
  const filteredDebts = filterTransactions(debts, masterDebts, filters)
  const { totalReceivables, totalLiabilities, net } = computeTotals(filteredDebts)

  const periodText =
    filters.time === 'all'
      ? '(All Time)'
      : (() => {
          const [year, month] = filters.time.split('-')
          return `(${month}/${year})`
        })()

  return (
    <div className="space-y-8">
      <SummaryCards
        net={net}
        totalReceivables={totalReceivables}
        totalLiabilities={totalLiabilities}
        periodText={periodText}
      />

      <NeuCard className="p-6 md:p-8 flex flex-col">
        <FilterBar
          filters={filters}
          filteredAccount={filteredAccount}
          uniqueMonths={uniqueMonths}
          onUpdateFilters={updateFilters}
          onOpenAdd={onOpenAdd}
        />

        <div className="overflow-x-auto pb-4">
          <TransactionTable
            debts={filteredDebts}
            masterDebts={masterDebts}
            editingId={editingId}
            onTogglePaid={onTogglePaid}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          {loading && <LoadingSpinner message="Syncing database..." />}

          {!loading && filteredDebts.length === 0 && (
            <EmptyState icon={FolderOpen} message="No records found" />
          )}
        </div>
      </NeuCard>
    </div>
  )
}
