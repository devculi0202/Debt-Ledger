import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useTransactions from '@/features/transactions/hooks/useTransactions'
import { useMasterDebtsList } from '@/features/master-debts/hooks/useMasterDebtsQuery'
import { useSessionData } from '@/app/providers/DataProvider'
import TransactionLedger from '@/features/transactions/ui/TransactionLedger'
import TransactionModal from '@/features/transactions/ui/TransactionModal'
import DuplicateMonthsModal from '@/features/transactions/ui/DuplicateMonthsModal'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import useConfirm from '@/shared/hooks/useConfirm'
import { useToast } from '@/shared/ui/Toast'
import { useLocale } from '@/shared/i18n'

export default function TransactionsPage() {
  const session = useSessionData()
  const { t } = useLocale()
  const { masterDebts } = useMasterDebtsList(session)
  const {
    debts,
    loading,
    editingId,
    modal,
    duplicateModal,
    openAdd,
    openEdit,
    closeModal,
    openDuplicate,
    closeDuplicateModal,
    handleSubmit,
    handleTogglePaid,
    handleDelete: rawDelete,
    handleDuplicateMonths,
  } = useTransactions()
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Overview quick action: open the add modal on arrival
  useEffect(() => {
    if (!location.state?.openAdd) return
    openAdd()
    navigate(location.pathname + location.search, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per navigation state
  }, [location.state])

  async function handleDelete(id) {
    const confirmed = await confirm(
      t('transactions.deleteTitle'),
      t('transactions.deleteMessage'),
    )
    if (!confirmed) return
    await rawDelete(id)
  }

  async function onSubmit(payload) {
    try {
      await handleSubmit(payload)
      toast.success(
        modal.mode === 'edit'
          ? t('transactions.updated')
          : t('transactions.added'),
      )
    } catch {
      toast.error(t('common.operationFailed'))
    }
  }

  async function onDuplicateSubmit(payloads) {
    try {
      await handleDuplicateMonths(payloads)
      const key =
        payloads.length === 1
          ? 'transactions.createdCount'
          : 'transactions.createdCountPlural'
      toast.success(t(key, { count: payloads.length }))
    } catch {
      toast.error(t('transactions.duplicateFailed'))
    }
  }

  return (
    <>
      <TransactionLedger
        debts={debts}
        masterDebts={masterDebts}
        loading={loading}
        editingId={editingId}
        onOpenAdd={openAdd}
        onTogglePaid={handleTogglePaid}
        onEdit={openEdit}
        onDelete={handleDelete}
        onDuplicate={openDuplicate}
      />
      <TransactionModal
        open={modal.open}
        mode={modal.mode}
        initialData={modal.data}
        masterDebts={masterDebts}
        onClose={closeModal}
        onSubmit={onSubmit}
      />
      <DuplicateMonthsModal
        open={duplicateModal.open}
        sourceDebt={duplicateModal.source}
        existingDebts={debts}
        masterDebts={masterDebts}
        onClose={closeDuplicateModal}
        onSubmit={onDuplicateSubmit}
      />
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
