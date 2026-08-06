import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lightbulb,
  Plus,
  Layers,
  Bell,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Wallet,
} from 'lucide-react'
import { useSessionData } from '@/app/providers/DataProvider'
import { useMasterDebtsList } from '@/features/master-debts/hooks/useMasterDebtsQuery'
import { useTransactionsList } from '@/features/transactions/hooks/useTransactionsQuery'
import {
  computeTotals,
  sortByDateDesc,
  getTransactionDate,
} from '@/entities/transaction/transactionCompute'
import { computeAccountSummary } from '@/entities/debt-account/accountSummary'
import { formatVND, isSettled } from '@/shared/lib/format'
import NeuCard from '@/shared/ui/NeuCard'
import LoadingSpinner from '@/shared/ui/LoadingSpinner'
import { useLocale } from '@/shared/i18n'

const DONUT_COLORS = [
  '#A8FF3E',
  '#55701E',
  '#C9E88A',
  '#6B7B54',
  '#9AA08E',
  '#39412B',
]

export default function OverviewPage() {
  const session = useSessionData()
  const navigate = useNavigate()
  const { t } = useLocale()
  const { masterDebts, loading: accountsLoading } = useMasterDebtsList(session)
  const { debts, loading: debtsLoading } = useTransactionsList(session)
  const [hidden, setHidden] = useState(false)

  const { totalReceivables, totalLiabilities, net } = computeTotals(debts)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthDebts = useMemo(
    () => debts.filter((d) => getTransactionDate(d).startsWith(thisMonth)),
    [debts, thisMonth],
  )
  const monthTotals = computeTotals(monthDebts)

  const breakdown = useMemo(() => {
    const items = masterDebts
      .map((account) => ({
        id: account.id,
        name: account.name,
        amount: computeAccountSummary(account, debts).remaining,
      }))
      .filter((item) => item.amount > 0)

    const standalone = debts
      .filter((d) => !d.account_id && !isSettled(d.paid))
      .reduce((sum, d) => sum + Number(d.amount), 0)
    if (standalone > 0) {
      items.push({ id: 'standalone', name: t('overview.standalone'), amount: standalone })
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0)
    return {
      total,
      items: items
        .sort((a, b) => b.amount - a.amount)
        .map((item, i) => ({
          ...item,
          percent: total > 0 ? (item.amount / total) * 100 : 0,
          color: DONUT_COLORS[i % DONUT_COLORS.length],
        })),
    }
  }, [masterDebts, debts, t])

  const insight = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const overdue = debts.filter(
      (d) => !isSettled(d.paid) && d.due_date && d.due_date < today,
    )
    if (overdue.length > 0) {
      const total = overdue.reduce((sum, d) => sum + Number(d.amount), 0)
      return {
        text: t(
          overdue.length === 1
            ? 'overview.insightOverdue'
            : 'overview.insightOverduePlural',
          { count: overdue.length, amount: formatVND(total) },
        ),
        cta: t('overview.insightCtaReminders'),
        to: '/reminders',
      }
    }
    const unpaid = debts.filter((d) => !isSettled(d.paid))
    if (unpaid.length > 0) {
      const largest = unpaid.reduce((max, d) =>
        Number(d.amount) > Number(max.amount) ? d : max,
      )
      return {
        text: t('overview.insightLargest', {
          name: largest.person,
          amount: formatVND(Number(largest.amount)),
        }),
        cta: t('overview.insightCtaTransactions'),
        to: '/transactions?status=active',
      }
    }
    return {
      text: t('overview.insightAllClear'),
      cta: t('overview.insightCtaAll'),
      to: '/transactions',
    }
  }, [debts, t])

  const recent = useMemo(() => sortByDateDesc(debts).slice(0, 4), [debts])

  if (accountsLoading || debtsLoading) {
    return <LoadingSpinner message={t('common.loadingData')} />
  }

  const mask = (value) => (hidden ? '••••••••' : formatVND(value))
  const txCountKey =
    monthDebts.length === 1 ? 'overview.txCount' : 'overview.txCountPlural'

  return (
    <div className="space-y-5">
      {/* Row 1 — summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr] gap-5">
        {/* Dark net position card */}
        <div className="rounded-neu-lg bg-ink text-white p-6 flex flex-col justify-between min-h-[150px] shadow-neu-drop sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            {t('overview.netPosition')}
            <button
              type="button"
              onClick={() => setHidden((v) => !v)}
              className="text-white/50 hover:text-white transition cursor-pointer"
              aria-label={hidden ? t('overview.showAmounts') : t('overview.hideAmounts')}
            >
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-3xl md:text-[2rem] font-extrabold tracking-tight my-2 break-all">
            {mask(net)}
          </p>
          <span className="self-start px-2.5 py-1 rounded-full bg-accent/15 text-accent text-[11px] font-bold">
            {t('overview.allTime')}
          </span>
        </div>

        <MetricCard
          dotClass="bg-brand-positive"
          label={t('overview.receivables')}
          value={mask(totalReceivables)}
          valueClass="text-brand-positive"
          hint={t('overview.unsettledHint')}
        />
        <MetricCard
          dotClass="bg-brand-negative"
          label={t('overview.liabilities')}
          value={mask(totalLiabilities)}
          valueClass="text-brand-negative"
          hint={t('overview.unsettledHint')}
        />
        <MetricCard
          dotClass="bg-accent"
          label={t('overview.monthlyActivity')}
          value={mask(monthTotals.net)}
          valueClass="text-neu-textMain dark:text-darkNeu-textMain"
          hint={`${t(txCountKey, { count: monthDebts.length })} · ${t('overview.thisMonth')}`}
        />
      </div>

      {/* Rows 2–3 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          {/* Debt Overview donut */}
          <NeuCard className="p-6">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h3 className="font-bold text-neu-textMain dark:text-darkNeu-textMain">
                  {t('overview.debtOverview')}
                </h3>
                <p className="text-xs text-neu-textMuted mt-1">
                  {t('overview.outstanding')}
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-neu-textMain dark:text-darkNeu-textMain mt-1">
                  {mask(breakdown.total)}
                </p>
              </div>
            </div>

            {breakdown.items.length === 0 ? (
              <p className="text-sm text-neu-textMuted py-10 text-center">
                {t('overview.noOutstanding')}
              </p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
                <Donut
                  items={breakdown.items}
                  centerTop={t('overview.largest')}
                  centerBottom={breakdown.items[0]?.name ?? ''}
                />
                <ul className="flex-1 w-full space-y-3">
                  {breakdown.items.slice(0, 6).map((item) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="flex-1 font-medium text-neu-textMain dark:text-darkNeu-textMain truncate">
                        {item.name}
                      </span>
                      <span className="font-bold text-neu-textMain dark:text-darkNeu-textMain whitespace-nowrap">
                        {mask(item.amount)}
                      </span>
                      <span className="w-10 text-right text-xs text-neu-textMuted">
                        {Math.round(item.percent)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </NeuCard>

          {/* Quick actions */}
          <NeuCard className="p-6">
            <h3 className="font-bold text-neu-textMain dark:text-darkNeu-textMain mb-4">
              {t('overview.quickActions')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction
                icon={Plus}
                label={t('overview.qaAddTransaction')}
                onClick={() => navigate('/transactions', { state: { openAdd: true } })}
              />
              <QuickAction
                icon={Layers}
                label={t('overview.qaNewAccount')}
                onClick={() => navigate('/master-debts', { state: { openCreate: true } })}
              />
              <QuickAction
                icon={Bell}
                label={t('overview.qaReminders')}
                onClick={() => navigate('/reminders')}
              />
              <QuickAction
                icon={ArrowLeftRight}
                label={t('overview.qaViewLedger')}
                onClick={() => navigate('/transactions')}
              />
            </div>
          </NeuCard>
        </div>

        <div className="space-y-5">
          {/* AI Smart Insight */}
          <div className="rounded-neu-lg bg-ink text-white p-6 shadow-neu-drop relative overflow-hidden">
            <Lightbulb
              className="absolute -right-3 -bottom-3 w-28 h-28 text-white/5"
              aria-hidden
            />
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-3">
              <Lightbulb className="w-4 h-4 text-accent" />
              {t('overview.insightTitle')}
            </div>
            <p className="text-base font-semibold leading-snug mb-5 relative z-10">
              {insight.text}
            </p>
            <button
              type="button"
              onClick={() => navigate(insight.to)}
              className="relative z-10 px-4 py-2.5 rounded-neu-md bg-accent text-ink text-sm font-bold hover:brightness-95 active:scale-[0.98] transition-all-custom cursor-pointer"
            >
              {insight.cta}
            </button>
          </div>

          {/* Recent transactions */}
          <NeuCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-neu-textMain dark:text-darkNeu-textMain">
                {t('overview.recent')}
              </h3>
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="text-xs font-bold text-accent-deep dark:text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                {t('overview.viewAll')}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recent.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-neu-textMuted">
                <Wallet className="w-6 h-6 mb-2 opacity-60" />
                <p className="text-sm font-medium">{t('overview.noRecent')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-line dark:divide-line-dark">
                {recent.map((debt) => (
                  <RecentRow key={debt.id} debt={debt} hidden={hidden} />
                ))}
              </ul>
            )}
          </NeuCard>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ dotClass, label, value, valueClass, hint }) {
  return (
    <NeuCard className="p-6 flex flex-col justify-between min-h-[150px]">
      <div className="flex items-center gap-2 text-sm font-medium text-neu-textMuted">
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        {label}
      </div>
      <p className={`text-xl md:text-2xl font-extrabold tracking-tight my-2 break-all ${valueClass}`}>
        {value}
      </p>
      <p className="text-[11px] font-medium text-neu-textMuted">{hint}</p>
    </NeuCard>
  )
}

function Donut({ items, centerTop, centerBottom }) {
  const gap = items.length > 1 ? 1.5 : 0
  // Accumulate stroke offsets starting at 12 o'clock (offset 25 on a 100-unit circle)
  const segments = items.reduce((acc, item) => {
    const prev = acc[acc.length - 1]
    acc.push({
      ...item,
      offset: prev ? prev.offset - prev.percent : 25,
    })
    return acc
  }, [])

  return (
    <div className="relative w-44 h-44 shrink-0">
      <svg viewBox="0 0 42 42" className="w-full h-full">
        {segments.map((item) => (
          <circle
            key={item.id}
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke={item.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(item.percent - gap, 0.5)} ${100 - Math.max(item.percent - gap, 0.5)}`}
            strokeDashoffset={item.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <span className="text-[10px] uppercase tracking-wider text-neu-textMuted font-bold">
          {centerTop}
        </span>
        <span className="text-sm font-bold text-neu-textMain dark:text-darkNeu-textMain truncate max-w-full">
          {centerBottom}
        </span>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-neu-md border border-line dark:border-line-dark bg-neu-bg/50 dark:bg-white/5 hover:bg-neu-bg dark:hover:bg-white/10 hover:border-neu-textMuted/40 active:scale-[0.98] transition-all-custom cursor-pointer"
    >
      <span className="w-9 h-9 rounded-full bg-neu-surface dark:bg-darkNeu-surface border border-line dark:border-line-dark flex items-center justify-center text-neu-textMain dark:text-darkNeu-textMain">
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-xs font-semibold text-neu-textMuted text-center leading-tight">
        {label}
      </span>
    </button>
  )
}

function RecentRow({ debt, hidden }) {
  const { t } = useLocale()
  const settled = isSettled(debt.paid)
  const isOwed = debt.type === 'owed'
  const amount = hidden ? '••••••' : formatVND(Number(debt.amount))

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          settled
            ? 'bg-neu-bg dark:bg-white/5 text-neu-textMuted'
            : isOwed
              ? 'bg-brand-positive/10 text-brand-positive'
              : 'bg-brand-negative/10 text-brand-negative'
        }`}
      >
        {settled ? (
          <Check className="w-4 h-4" />
        ) : isOwed ? (
          <ArrowDownLeft className="w-4 h-4" />
        ) : (
          <ArrowUpRight className="w-4 h-4" />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            settled
              ? 'text-neu-textMuted line-through'
              : 'text-neu-textMain dark:text-darkNeu-textMain'
          }`}
        >
          {debt.person}
        </p>
        <p className="text-[11px] text-neu-textMuted">
          {getTransactionDate(debt)}
          {settled ? ` · ${t('transactions.settled')}` : ''}
        </p>
      </div>
      <span
        className={`text-sm font-bold whitespace-nowrap ${
          settled
            ? 'text-neu-textMuted line-through'
            : isOwed
              ? 'text-brand-positive'
              : 'text-brand-negative'
        }`}
      >
        {settled ? '' : isOwed ? '+' : '-'}
        {amount}
      </span>
    </li>
  )
}
