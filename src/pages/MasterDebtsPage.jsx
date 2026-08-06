import { useNavigate } from 'react-router-dom'
import useMasterDebts from '@/features/master-debts/hooks/useMasterDebts'
import { useTransactionsList } from '@/features/transactions/hooks/useTransactionsQuery'
import { useSessionData } from '@/app/providers/DataProvider'
import MasterDebtList from '@/features/master-debts/ui/MasterDebtList'
import MasterDebtModal from '@/features/master-debts/ui/MasterDebtModal'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import useConfirm from '@/shared/hooks/useConfirm'
import { useToast } from '@/shared/ui/Toast'
import { viewLedgerPath } from '@/entities/transaction/transactionFilters'

export default function MasterDebtsPage() {
  const navigate = useNavigate()
  const session = useSessionData()
  const {
    masterDebts,
    loading,
    modal,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDelete: rawDelete,
  } = useMasterDebts()
  const { debts } = useTransactionsList(session)
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()
  const toast = useToast()

  async function handleDelete(id) {
    const confirmed = await confirm(
      'Delete Account',
      'Delete this debt account? Linked transactions will not be deleted, but they will become unlinked.',
    )
    if (!confirmed) return
    await rawDelete(id)
  }

  async function onSubmit(payload) {
    try {
      await handleSubmit(payload)
      toast.success(modal.mode === 'edit' ? 'Account updated.' : 'Account created.')
    } catch {
      toast.error('Operation failed.')
    }
  }

  function handleViewLedger(account) {
    navigate(viewLedgerPath(account.id))
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
