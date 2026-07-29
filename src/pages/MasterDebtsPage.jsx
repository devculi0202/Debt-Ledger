import { useMasterDebtsData, useTransactionsData } from '../contexts/DataContext'
import MasterDebtList from '../components/MasterDebtList'
import MasterDebtModal from '../components/modals/MasterDebtModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useConfirm from '../hooks/useConfirm'
import { useToast } from '../components/ui/Toast'

export default function MasterDebtsPage() {
  const {
    masterDebts,
    loading,
    modal,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDelete: rawDelete,
    handleViewLedger,
  } = useMasterDebtsData()
  const { debts } = useTransactionsData()
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()
  const toast = useToast()

  async function handleDelete(id) {
    const confirmed = await confirm(
      'Delete Account',
      'Delete this Master Account? Linked transactions will NOT be deleted, but they will become unlinked.',
    )
    if (!confirmed) return
    await rawDelete(id, { skipConfirm: true })
  }

  async function onSubmit(payload) {
    try {
      await handleSubmit(payload)
      toast.success(modal.mode === 'edit' ? 'Account updated.' : 'Account created.')
    } catch {
      toast.error('Operation failed.')
    }
  }

  return (
    <>
      <MasterDebtList
        masterDebts={masterDebts}
        debts={debts}
        loading={loading}
        onOpenCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        onViewLedger={handleViewLedger}
      />
      <MasterDebtModal
        open={modal.open}
        mode={modal.mode}
        initialData={modal.data}
        onClose={closeModal}
        onSubmit={onSubmit}
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
