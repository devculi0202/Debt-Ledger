import {
  Calendar,
  Timer,
  Check,
  RotateCcw,
  Pencil,
  Trash2,
  Copy,
  Link2,
} from 'lucide-react'
import { formatVND, isSettled } from '@/shared/lib/format'
import NeuIconButton from '@/shared/ui/NeuIconButton'
import { useLocale } from '@/shared/i18n'

export default function TransactionTable({
  debts,
  masterDebts,
  editingId,
  onTogglePaid,
  onEdit,
  onDelete,
  onDuplicate,
}) {
  const { t } = useLocale()
  if (debts.length === 0) return null

  return (
    <table className="w-full text-left border-collapse min-w-[750px]">
      <thead>
        <tr className="text-neu-textMuted text-[11px] uppercase tracking-widest font-bold border-b border-line dark:border-line-dark">
          <th className="px-4 py-4 w-36">{t('transactions.statusDate')}</th>
          <th className="px-4 py-4">{t('transactions.person')}</th>
          <th className="px-4 py-4">{t('transactions.debtAccount')}</th>
          <th className="px-4 py-4">{t('transactions.details')}</th>
          <th className="px-4 py-4 text-right">{t('transactions.amountVnd')}</th>
          <th className="px-4 py-4 text-center">{t('transactions.actions')}</th>
        </tr>
      </thead>
      <tbody className="text-sm">
        {debts.map((debt) => (
          <TransactionRow
            key={debt.id}
            debt={debt}
            masterDebts={masterDebts}
            isEditing={editingId === debt.id}
            onTogglePaid={onTogglePaid}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        ))}
      </tbody>
    </table>
  )
}

function TransactionRow({
  debt,
  masterDebts,
  isEditing,
  onTogglePaid,
  onEdit,
  onDelete,
  onDuplicate,
}) {
  const { t } = useLocale()
  const settled = isSettled(debt.paid)
  const badgeClass = settled
    ? 'bg-neu-bg dark:bg-white/5 text-neu-textMuted'
    : debt.type === 'owed'
      ? 'bg-brand-positive/10 text-brand-positive'
      : 'bg-brand-negative/10 text-brand-negative'
  const statusLabel = settled
    ? t('transactions.settled')
    : debt.type === 'owed'
      ? t('transactions.owedToMe')
      : t('transactions.iOwe')
  const amountColor = settled
    ? 'text-neu-textMuted line-through'
    : debt.type === 'owed'
      ? 'text-brand-positive'
      : 'text-brand-negative'
  const displayDate = debt.transaction_date || debt.created_at.split('T')[0]
  const amountDisplay =
    (debt.type === 'owe' && !settled
      ? '-'
      : debt.type === 'owed' && !settled
        ? '+'
        : '') + formatVND(Number(debt.amount))

  const linkedAcc = debt.account_id
    ? masterDebts.find((md) => String(md.id) === String(debt.account_id))
    : null

  return (
    <tr
      className={`group border-b border-line dark:border-line-dark last:border-b-0 hover:bg-neu-bg/40 dark:hover:bg-white/[0.03] transition-colors ${
        settled ? 'opacity-55' : ''
      } ${isEditing ? 'bg-accent/10 dark:bg-accent/5' : ''}`}
    >
      <td className="p-4">
        <div className="flex flex-col items-start gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neu-bg dark:bg-white/5 border border-line dark:border-line-dark text-[10px] font-bold uppercase tracking-wider text-neu-textMain dark:text-darkNeu-textMain">
            <Link2 className="w-3 h-3 text-neu-textMuted" />
            <span className="truncate max-w-[120px]">{linkedAcc.name}</span>
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
            {t('transactions.due', { date: debt.due_date })}
          </div>
        ) : null}
      </td>
      <td
        className={`p-4 font-extrabold text-right text-base tracking-tight ${amountColor}`}
      >
        {amountDisplay}
      </td>
      <td className="p-4 text-center space-x-2 whitespace-nowrap">
        <NeuIconButton
          size="sm"
          onClick={() => onTogglePaid(debt.id)}
          className="hover:text-brand-positive"
          title={t('transactions.toggleStatus')}
        >
          {settled ? (
            <RotateCcw className="w-3.5 h-3.5" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </NeuIconButton>
        <NeuIconButton
          size="sm"
          onClick={() => onEdit(debt)}
          className="hover:text-neu-textMain dark:hover:text-darkNeu-textMain"
          title={t('common.edit')}
        >
          <Pencil className="w-3.5 h-3.5" />
        </NeuIconButton>
        <NeuIconButton
          size="sm"
          onClick={() => onDelete(debt.id)}
          className="hover:text-brand-negative"
          title={t('common.delete')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </NeuIconButton>
        <NeuIconButton
          size="sm"
          onClick={() => onDuplicate(debt)}
          className="hover:text-accent-deep dark:hover:text-accent"
          title={t('transactions.duplicateToMonths')}
        >
          <Copy className="w-3.5 h-3.5" />
        </NeuIconButton>
      </td>
    </tr>
  )
}
