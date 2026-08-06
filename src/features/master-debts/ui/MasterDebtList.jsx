import { useEffect, useState } from 'react'
import {
  Plus,
  Smartphone,
  HandCoins,
  Building2,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { formatVND } from '@/shared/lib/format'
import { computeAccountSummary } from '@/entities/debt-account/accountSummary'
import { paginate } from '@/shared/lib/pagination'
import LoadingSpinner from '@/shared/ui/LoadingSpinner'
import NeuCard from '@/shared/ui/NeuCard'
import NeuIconButton from '@/shared/ui/NeuIconButton'
import NeuButton from '@/shared/ui/NeuButton'
import Pagination from '@/shared/ui/Pagination'

export default function MasterDebtList({
  masterDebts,
  debts,
  loading,
  onOpenCreate,
  onEdit,
  onDelete,
  onViewLedger,
}) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [masterDebts.length])

  const { items: pagedDebts, page: safePage, totalCount, totalPages } = paginate(
    masterDebts,
    page,
  )

  if (loading) {
    return (
      <div className="space-y-8">
        <Header onOpenCreate={onOpenCreate} />
        <LoadingSpinner message="Loading Data..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Header onOpenCreate={onOpenCreate} />

      {masterDebts.length === 0 ? (
        <button
          type="button"
          onClick={onOpenCreate}
          className="w-full rounded-neu-lg p-12 flex flex-col items-center justify-center text-neu-textMuted shadow-neu-inner dark:shadow-neu-dark-inner transition group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop flex items-center justify-center mb-6 transition group-active:shadow-neu-inner">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-neu-textMain dark:text-darkNeu-textMain">
            Create your first debt account
          </span>
          <span className="text-sm mt-2 text-center max-w-xs">
            Use an account for a loan or ongoing debt. Log each payment under
            Transactions and link it here.
          </span>
        </button>
      ) : (
        <div className="space-y-8 mt-8">
          {pagedDebts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              debts={debts}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewLedger={onViewLedger}
            />
          ))}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}

function AccountCard({ account, debts, onEdit, onDelete, onViewLedger }) {
  const { linked, settled, amountPaid, remaining, progressPercent } =
    computeAccountSummary(account, debts)

  const isOwe = account.type === 'owe'
  const textColor = isOwe ? 'text-brand-negative' : 'text-brand-positive'
  const badgeText = isOwe ? 'I Owe' : 'Owed To Me'
  const progressColor = isOwe
    ? 'bg-brand-positive shadow-[0_0_8px_rgba(16,185,129,0.5)]'
    : 'bg-brand-negative shadow-[0_0_8px_rgba(239,68,68,0.5)]'

  return (
    <NeuCard className="p-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div
            className={`w-16 h-16 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner flex items-center justify-center text-2xl shrink-0 ${textColor}`}
          >
            {isOwe ? (
              <Smartphone className="w-7 h-7 drop-shadow-sm" />
            ) : (
              <HandCoins className="w-7 h-7 drop-shadow-sm" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-neu-drop dark:shadow-neu-dark-drop ${textColor}`}
              >
                {badgeText}
              </span>
              <h3 className="text-2xl font-bold text-neu-textMain dark:text-darkNeu-textMain">
                {account.name}
              </h3>
            </div>
            <p className="text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted">
              Principal:{' '}
              <span className="font-bold text-neu-textMain dark:text-darkNeu-textMain text-base ml-1">
                {formatVND(account.principal_amount)}
              </span>
            </p>
            {account.creditor ? (
              <p className="text-xs text-neu-textMuted/70 mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {account.creditor}
              </p>
            ) : null}
          </div>
        </div>

        <div className="w-full xl:w-2/5">
          <div className="flex justify-between text-xs font-bold mb-3 tracking-wide">
            <span className="text-brand-positive drop-shadow-sm">
              Settled: {formatVND(amountPaid)}
            </span>
            <span className="text-brand-negative drop-shadow-sm">
              Remaining: {formatVND(remaining)}
            </span>
          </div>
          <div className="w-full bg-neu-surface dark:bg-darkNeu-surface rounded-full h-3 shadow-neu-inner dark:shadow-neu-dark-inner overflow-hidden p-[2px]">
            <div
              className={`${progressColor} h-full rounded-full relative transition-all duration-1000 ease-out`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neu-textMuted mt-2">
            Progress counts settled linked payments only. Mark a transaction
            settled for it to reduce remaining.
          </p>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-4">
              <NeuIconButton
                onClick={() => onEdit(account)}
                className="hover:text-neu-textMain"
              >
                <Pencil className="w-3.5 h-3.5" />
              </NeuIconButton>
              <NeuIconButton
                onClick={() => onDelete(account.id)}
                className="hover:text-brand-negative"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </NeuIconButton>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-neu-textMain dark:text-darkNeu-textMain">
                {progressPercent.toFixed(1)}%
              </span>
              <p className="text-[10px] text-neu-textMuted mt-0.5 uppercase tracking-wider">
                {linked.length} linked /{' '}
                <span className="text-brand-positive">
                  {settled.length} settled
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 flex justify-end">
        <NeuButton onClick={() => onViewLedger(account)}>
          View Ledger <ArrowRight className="w-3.5 h-3.5" />
        </NeuButton>
      </div>
    </NeuCard>
  )
}

function Header({ onOpenCreate }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div>
        <h2 className="text-3xl font-bold text-neu-textMain dark:text-darkNeu-textMain tracking-tight">
          Debt Accounts
        </h2>
        <p className="text-sm text-neu-textMuted mt-2 font-medium max-w-xl">
          Long-term loans or debts with a principal. Log each payment under
          Transactions and link it to an account to track progress.
        </p>
      </div>
      <NeuButton onClick={onOpenCreate} className="w-full sm:w-auto justify-center py-3.5 px-6 gap-3">
        <Plus className="w-3.5 h-3.5" /> New Account
      </NeuButton>
    </div>
  )
}
