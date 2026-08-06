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

export default function TransactionTable({
  debts,
  masterDebts,
  editingId,
  onTogglePaid,
  onEdit,
  onDelete,
  onDuplicate,
}) {
  if (debts.length === 0) return null

  return (
    <table className="w-full text-left border-collapse min-w-[750px]">
      <thead>
        <tr className="text-neu-textMuted text-[11px] uppercase tracking-widest font-bold">
          <th className="px-4 py-4 w-36">Status / Date</th>
          <th className="px-4 py-4">Person</th>
          <th className="px-4 py-4">Debt Account</th>
          <th className="px-4 py-4">Details</th>
          <th className="px-4 py-4 text-right">Amount (VNĐ)</th>
          <th className="px-4 py-4 text-center">Actions</th>
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
  const settled = isSettled(debt.paid)
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
        <NeuIconButton
          size="sm"
          onClick={() => onTogglePaid(debt.id)}
          className="hover:text-brand-positive"
          title="Toggle Status"
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
          className="hover:text-neu-textMain"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </NeuIconButton>
        <NeuIconButton
          size="sm"
          onClick={() => onDelete(debt.id)}
          className="hover:text-brand-negative"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </NeuIconButton>
        <NeuIconButton
          size="sm"
          onClick={() => onDuplicate(debt)}
          className="hover:text-neu-primary"
          title="Duplicate to months"
        >
          <Copy className="w-3.5 h-3.5" />
        </NeuIconButton>
      </td>
    </tr>
  )
}
