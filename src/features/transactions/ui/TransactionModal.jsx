import { useEffect, useState } from 'react'
import { Plus, Pencil, X, Link2, LoaderCircle } from 'lucide-react'
import { formatVND } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useLocale } from '@/shared/i18n'

const emptyForm = {
  type: 'owe',
  account_id: 'none',
  person: '',
  amount: '',
  transaction_date: '',
  due_date: '',
  notes: '',
}

export default function TransactionModal({
  open,
  mode = 'create',
  initialData = null,
  masterDebts = [],
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()
  const { t } = useLocale()

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initialData) {
      const accountId = initialData.account_id || 'none'
      const account =
        accountId !== 'none'
          ? masterDebts.find((a) => String(a.id) === String(accountId))
          : null
      setForm({
        type: account?.type || initialData.type || 'owe',
        account_id: accountId,
        person: initialData.person || '',
        amount: initialData.amount ?? '',
        transaction_date: initialData.transaction_date || '',
        due_date: initialData.due_date || '',
        notes: initialData.notes || '',
      })
    } else {
      setForm({
        ...emptyForm,
        transaction_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [open, mode, initialData, masterDebts])

  if (!open) return null

  const isEdit = mode === 'edit'

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => {
      if (field !== 'account_id') {
        return { ...prev, [field]: value }
      }
      if (value === 'none') {
        return { ...prev, account_id: value }
      }
      const account = masterDebts.find((a) => String(a.id) === String(value))
      return {
        ...prev,
        account_id: value,
        type: account?.type || prev.type,
        person:
          prev.person.trim() || account?.creditor?.trim() || prev.person,
      }
    })
  }

  const linkedAccount =
    form.account_id !== 'none'
      ? masterDebts.find((a) => String(a.id) === String(form.account_id))
      : null
  const typeLocked = Boolean(linkedAccount)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amt = parseInt(form.amount, 10)
    if (isNaN(amt) || amt < 0) {
      toast.warning(t('common.pleaseValidAmount'))
      return
    }

    setSubmitting(true)
    try {
      const accountId = form.account_id === 'none' ? null : form.account_id
      const account = accountId
        ? masterDebts.find((a) => String(a.id) === String(accountId))
        : null
      await onSubmit({
        type: account?.type || form.type,
        person: form.person.trim(),
        amount: amt,
        transaction_date: form.transaction_date,
        due_date: form.due_date || null,
        notes: form.notes.trim(),
        account_id: accountId,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3.5 shadow-neu-inner dark:shadow-neu-dark-inner outline-none border-none text-sm'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neu-bg/80 dark:bg-darkNeu-bg/80 backdrop-blur-md transition-opacity px-4">
      <div className="bg-neu-surface dark:bg-darkNeu-surface w-full max-w-md rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop p-6 transform transition-all max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner flex items-center justify-center">
              {isEdit ? (
                <Pencil className="w-3.5 h-3.5 text-neu-primary dark:text-darkNeu-textMain" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-neu-primary dark:text-darkNeu-textMain" />
              )}
            </div>
            {isEdit ? t('transactions.updateTitle') : t('transactions.logTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neu-textMuted hover:text-brand-negative transition w-8 h-8 flex items-center justify-center rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              {t('transactions.type')}
            </label>
            <select
              value={form.type}
              onChange={handleChange('type')}
              disabled={typeLocked}
              className={`${inputClass} appearance-none disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <option value="owe">{t('transactions.iOweMinus')}</option>
              <option value="owed">{t('transactions.owedToMePlus')}</option>
            </select>
            {typeLocked ? (
              <p className="text-xs text-neu-textMuted mt-1.5 pl-1">
                {t('transactions.typeLockedHint')}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-primary dark:text-darkNeu-textMain mb-2 pl-1 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> {t('transactions.linkAccount')}
            </label>
            <select
              value={form.account_id}
              onChange={handleChange('account_id')}
              className={`${inputClass} text-xs font-medium appearance-none`}
            >
              <option value="none">{t('transactions.standalone')}</option>
              {masterDebts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.type === 'owe' ? '💳' : '💰'} {account.name} (
                  {formatVND(account.principal_amount)})
                </option>
              ))}
            </select>
            <p className="text-xs text-neu-textMuted mt-1.5 pl-1">
              {t('transactions.linkHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              {t('transactions.person')}
            </label>
            <input
              type="text"
              required
              value={form.person}
              onChange={handleChange('person')}
              placeholder={t('transactions.personPlaceholder')}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              {t('transactions.amount')}
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                step="1"
                value={form.amount}
                onChange={handleChange('amount')}
                placeholder="100000"
                className="w-full bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3.5 pr-10 shadow-neu-inner dark:shadow-neu-dark-inner outline-none border-none text-base font-semibold"
              />
              <span className="absolute right-4 top-3.5 text-neu-textMuted font-medium">
                ₫
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
                {t('transactions.txDate')}
              </label>
              <input
                type="date"
                required
                value={form.transaction_date}
                onChange={handleChange('transaction_date')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
                {t('transactions.dueDate')}
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={handleChange('due_date')}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              {t('transactions.notes')}
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={handleChange('notes')}
              placeholder={t('common.optional')}
              className={inputClass}
            />
          </div>

          <div className="pt-4 flex gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMain dark:text-darkNeu-textMain font-semibold rounded-neu-md transition-all-custom"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-neu-primary text-white shadow-neu-drop dark:shadow-neu-dark-drop font-semibold rounded-neu-md hover:opacity-90 active:shadow-neu-inner transition-all-custom flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                t('common.save')
              ) : (
                t('transactions.addRecord')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
