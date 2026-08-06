import useTransactions from '@/features/transactions/hooks/useTransactions'
import { useMasterDebtsList } from '@/features/master-debts/hooks/useMasterDebtsQuery'
import { useSessionData } from '@/app/providers/DataProvider'
import TransactionLedger from '@/features/transactions/ui/TransactionLedger'
import TransactionModal from '@/features/transactions/ui/TransactionModal'
import DuplicateMonthsModal from '@/features/transactions/ui/DuplicateMonthsModal'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import useConfirm from '@/shared/hooks/useConfirm'
import { useToast } from '@/shared/ui/Toast'

export default function TransactionsPage() {
  const session = useSessionData()
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

  async function handleDelete(id) {
    const confirmed = await confirm(
      'Delete Record',
      'Delete this record? Action cannot be undone.',
    )
    if (!confirmed) return
    await rawDelete(id)
  }

  async function onSubmit(payload) {
    try {
      await handleSubmit(payload)
      toast.success(modal.mode === 'edit' ? 'Transaction updated.' : 'Transaction added.')
    } catch {
      toast.error('Operation failed.')
    }
  }

  async function onDuplicateSubmit(payloads) {
    try {
      await handleDuplicateMonths(payloads)
      toast.success(
        `Created ${payloads.length} transaction${payloads.length !== 1 ? 's' : ''}.`,
      )
    } catch {
      toast.error('Duplicate failed.')
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
