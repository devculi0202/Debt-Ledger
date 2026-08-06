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
import { useLocale } from '@/shared/i18n'

export default function MasterDebtList({
  masterDebts,
  debts,
  loading,
  onOpenCreate,
  onEdit,
  onDelete,
  onViewLedger,
}) {
  const { t } = useLocale()
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
      <div className="space-y-6">
        <Header onOpenCreate={onOpenCreate} />
        <LoadingSpinner message={t('common.loadingData')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header onOpenCreate={onOpenCreate} />

      {masterDebts.length === 0 ? (
        <button
          type="button"
          onClick={onOpenCreate}
          className="w-full rounded-neu-lg p-12 flex flex-col items-center justify-center text-neu-textMuted bg-neu-surface/60 dark:bg-darkNeu-surface/60 border-2 border-dashed border-line dark:border-line-dark hover:border-neu-textMuted/50 transition group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-ink text-accent flex items-center justify-center mb-6 transition group-hover:scale-105">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-neu-textMain dark:text-darkNeu-textMain">
            {t('masterDebts.emptyTitle')}
          </span>
          <span className="text-sm mt-2 text-center max-w-xs">
            {t('masterDebts.emptyHint')}
          </span>
        </button>
      ) : (
        <div className="space-y-5">
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
  const { t } = useLocale()
  const { linked, settled, amountPaid, remaining, progressPercent } =
    computeAccountSummary(account, debts)

  const isOwe = account.type === 'owe'
  const textColor = isOwe ? 'text-brand-negative' : 'text-brand-positive'
  const badgeClass = isOwe
    ? 'bg-brand-negative/10 text-brand-negative'
    : 'bg-brand-positive/10 text-brand-positive'
  const iconBg = isOwe ? 'bg-brand-negative/10' : 'bg-brand-positive/10'

  return (
    <NeuCard className="p-6 md:p-7">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="flex items-center gap-5 w-full xl:w-auto">
          <div
            className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 ${textColor}`}
          >
            {isOwe ? (
              <Smartphone className="w-6 h-6" />
            ) : (
              <HandCoins className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${badgeClass}`}
              >
                {isOwe ? t('masterDebts.iOwe') : t('masterDebts.owedToMe')}
              </span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-neu-textMain dark:text-darkNeu-textMain">
                {account.name}
              </h3>
            </div>
            <p className="text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted">
              {t('masterDebts.principal')}{' '}
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
            <span className="text-brand-positive">
              {t('masterDebts.settled', { amount: formatVND(amountPaid) })}
            </span>
            <span className="text-brand-negative">
              {t('masterDebts.remaining', { amount: formatVND(remaining) })}
            </span>
          </div>
          <div className="w-full bg-neu-bg dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full relative transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neu-textMuted mt-2">
            {t('masterDebts.progressHint')}
          </p>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-3">
              <NeuIconButton
                onClick={() => onEdit(account)}
                className="hover:text-neu-textMain dark:hover:text-darkNeu-textMain"
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
              <span className="font-extrabold text-lg text-neu-textMain dark:text-darkNeu-textMain">
                {progressPercent.toFixed(1)}%
              </span>
              <p className="text-[10px] text-neu-textMuted mt-0.5 uppercase tracking-wider">
                {t('masterDebts.linkedSettled', {
                  linked: linked.length,
                  settled: settled.length,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 pt-5 border-t border-line dark:border-line-dark flex justify-end">
        <NeuButton onClick={() => onViewLedger(account)}>
          {t('masterDebts.viewLedger')} <ArrowRight className="w-3.5 h-3.5" />
        </NeuButton>
      </div>
    </NeuCard>
  )
}

function Header({ onOpenCreate }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-neu-textMain dark:text-darkNeu-textMain tracking-tight">
          {t('masterDebts.title')}
        </h2>
        <p className="text-sm text-neu-textMuted mt-2 font-medium max-w-xl">
          {t('masterDebts.subtitle')}
        </p>
      </div>
      <NeuButton
        variant="primary"
        onClick={onOpenCreate}
        className="w-full sm:w-auto justify-center py-3.5 px-6 gap-3"
      >
        <Plus className="w-3.5 h-3.5" /> {t('masterDebts.newAccount')}
      </NeuButton>
    </div>
  )
}
