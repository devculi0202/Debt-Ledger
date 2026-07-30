import { useMasterDebtsData, useTransactionsData } from '../contexts/DataContext'
import TransactionLedger from '../components/TransactionLedger'
import TransactionModal from '../components/modals/TransactionModal'
import DuplicateMonthsModal from '../components/modals/DuplicateMonthsModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useConfirm from '../hooks/useConfirm'
import { useToast } from '../components/ui/Toast'

export default function TransactionsPage() {
  const { masterDebts } = useMasterDebtsData()
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
  } = useTransactionsData()
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()
  const toast = useToast()

  async function handleDelete(id) {
    const confirmed = await confirm(
      'Delete Record',
      'Delete this record? Action cannot be undone.',
    )
    if (!confirmed) return
    await rawDelete(id, { skipConfirm: true })
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
