import {
  Plus,
  Smartphone,
  HandCoins,
  Building2,
  Pencil,
  Trash2,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react'
import { formatVND, isSettled } from '../lib/format'

export default function MasterDebtList({
  masterDebts,
  debts,
  loading,
  onOpenCreate,
  onEdit,
  onDelete,
  onViewLedger,
}) {
  if (loading) {
    return (
      <div className="space-y-8">
        <Header onOpenCreate={onOpenCreate} />
        <div className="flex flex-col items-center justify-center py-20 text-neu-textMuted">
          <div className="w-12 h-12 rounded-full shadow-neu-inner flex items-center justify-center mb-6">
            <LoaderCircle className="w-5 h-5 animate-spin text-neu-primary dark:text-darkNeu-textMain" />
          </div>
          <p className="font-medium">Loading Data...</p>
        </div>
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
            Create First Account
          </span>
          <span className="text-sm mt-2 text-center max-w-xs">
            Group multiple payments into one tracking system.
          </span>
        </button>
      ) : (
        <div className="space-y-8 mt-8">
          {masterDebts.map((account) => {
            const allLinked = debts.filter((d) => d.account_id == account.id)
            const settled = allLinked.filter((d) => isSettled(d.paid))
            const amountPaid = settled.reduce(
              (sum, t) => sum + Number(t.amount),
              0,
            )
            const remaining = Math.max(0, account.principal_amount - amountPaid)
            const progressPercent =
              account.principal_amount > 0
                ? Math.min(100, (amountPaid / account.principal_amount) * 100)
                : 0
            const isOwe = account.type === 'owe'
            const textColor = isOwe
              ? 'text-brand-negative'
              : 'text-brand-positive'
            const badgeText = isOwe ? 'I Owe' : 'Owed To Me'
            const progressColor = isOwe
              ? 'bg-brand-positive shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : 'bg-brand-negative shadow-[0_0_8px_rgba(239,68,68,0.5)]'

            return (
              <div
                key={account.id}
                className="bg-neu-surface dark:bg-darkNeu-surface rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop p-8"
              >
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
                        Paid: {formatVND(amountPaid)}
                      </span>
                      <span className="text-brand-negative drop-shadow-sm">
                        Remain: {formatVND(remaining)}
                      </span>
                    </div>
                    <div className="w-full bg-neu-surface dark:bg-darkNeu-surface rounded-full h-3 shadow-neu-inner dark:shadow-neu-dark-inner overflow-hidden p-[2px]">
                      <div
                        className={`${progressColor} h-full rounded-full relative transition-all duration-1000 ease-out`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => onEdit(account)}
                          className="w-9 h-9 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMuted hover:text-neu-textMain transition flex justify-center items-center"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(account.id)}
                          className="w-9 h-9 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMuted hover:text-brand-negative transition flex justify-center items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg text-neu-textMain dark:text-darkNeu-textMain">
                          {progressPercent.toFixed(1)}%
                        </span>
                        <p className="text-[10px] text-neu-textMuted mt-0.5 uppercase tracking-wider">
                          {allLinked.length} logs /{' '}
                          <span className="text-brand-positive">
                            {settled.length} done
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onViewLedger(account)}
                    className="px-5 py-2.5 rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-sm font-bold text-neu-textMain hover:opacity-80 transition flex items-center gap-2"
                  >
                    View Ledger <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Header({ onOpenCreate }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div>
        <h2 className="text-3xl font-bold text-neu-textMain dark:text-darkNeu-textMain tracking-tight">
          Debt Accounts
        </h2>
        <p className="text-sm text-neu-textMuted mt-2 font-medium">
          Manage your structured loan plans.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenCreate}
        className="px-6 py-3.5 bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner text-sm font-bold rounded-neu-md transition-all-custom flex items-center gap-3 w-full sm:w-auto justify-center"
      >
        <Plus className="w-3.5 h-3.5" /> New Account
      </button>
    </div>
  )
}
