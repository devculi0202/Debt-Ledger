import { useEffect, useState } from 'react'
import { Layers, Pencil, X, ArrowDown, ArrowUp, LoaderCircle } from 'lucide-react'
import { useToast } from '../ui/Toast'

const emptyForm = {
  name: '',
  type: 'owe',
  principal: '',
  creditor: '',
}

export default function MasterDebtModal({
  open,
  mode = 'create',
  initialData = null,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initialData) {
      setForm({
        name: initialData.name || '',
        type: initialData.type || 'owe',
        principal: initialData.principal_amount ?? '',
        creditor: initialData.creditor || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, mode, initialData])

  if (!open) return null

  const isEdit = mode === 'edit'

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const principal = parseInt(form.principal, 10)
    if (!name || isNaN(principal) || principal < 0) {
      toast.warning('Please fill in valid information.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name,
        type: form.type,
        principal_amount: principal,
        creditor: form.creditor.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabelClass = (value) =>
    `relative flex cursor-pointer rounded-neu-md bg-neu-surface dark:bg-darkNeu-surface p-3 shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner transition-all-custom ${
      form.type === value
        ? 'shadow-neu-inner dark:shadow-neu-dark-inner'
        : ''
    } ${value === 'owe' ? 'text-brand-negative' : 'text-brand-positive'}`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neu-bg/80 dark:bg-darkNeu-bg/80 backdrop-blur-md transition-opacity px-4">
      <div className="bg-neu-surface dark:bg-darkNeu-surface w-full max-w-md rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop p-6 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner flex items-center justify-center">
              {isEdit ? (
                <Pencil className="w-3.5 h-3.5 text-neu-primary dark:text-darkNeu-textMain" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-neu-primary dark:text-darkNeu-textMain" />
              )}
            </div>
            {isEdit ? 'Edit Debt Account' : 'Create Debt Account'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neu-textMuted hover:text-brand-negative transition w-8 h-8 flex items-center justify-center rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              Account Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={handleChange('name')}
              placeholder="e.g. Vay mua laptop..."
              className="w-full bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3.5 shadow-neu-inner dark:shadow-neu-dark-inner outline-none focus:ring-2 focus:ring-neu-primary/20 text-sm placeholder:text-neu-textMuted/50 border-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              Debt Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={typeLabelClass('owe')}>
                <input
                  type="radio"
                  name="mdType"
                  value="owe"
                  checked={form.type === 'owe'}
                  onChange={handleChange('type')}
                  className="peer sr-only"
                />
                <div className="flex items-center gap-2 mx-auto">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">I Owe (-)</span>
                </div>
              </label>
              <label className={typeLabelClass('owed')}>
                <input
                  type="radio"
                  name="mdType"
                  value="owed"
                  checked={form.type === 'owed'}
                  onChange={handleChange('type')}
                  className="peer sr-only"
                />
                <div className="flex items-center gap-2 mx-auto">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">Owed to Me (+)</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              Principal Amount (VNĐ)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                value={form.principal}
                onChange={handleChange('principal')}
                placeholder="50000000"
                className="w-full bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3.5 pr-10 shadow-neu-inner dark:shadow-neu-dark-inner outline-none focus:ring-2 focus:ring-neu-primary/20 text-base font-bold placeholder:text-neu-textMuted/30 border-none"
              />
              <span className="absolute right-4 top-3.5 text-neu-textMuted font-medium">
                ₫
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-textMuted dark:text-darkNeu-textMuted mb-2 pl-1">
              {isEdit ? 'Entity/Creditor' : 'Creditor (Optional)'}
            </label>
            <input
              type="text"
              value={form.creditor}
              onChange={handleChange('creditor')}
              placeholder="e.g. FE Credit"
              className="w-full bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain rounded-neu-md p-3.5 shadow-neu-inner dark:shadow-neu-dark-inner outline-none focus:ring-2 focus:ring-neu-primary/20 text-sm placeholder:text-neu-textMuted/50 border-none"
            />
          </div>

          <div className="pt-4 flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain font-semibold rounded-neu-md transition-all-custom"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-neu-primary text-white shadow-neu-drop dark:shadow-neu-dark-drop font-semibold rounded-neu-md hover:opacity-90 active:shadow-neu-inner transition-all-custom flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                'Save'
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
