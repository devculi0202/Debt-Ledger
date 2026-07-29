import useMasterDebts from '../hooks/useMasterDebts'
import useTransactions from '../hooks/useTransactions'
import MasterDebtList from '../components/MasterDebtList'
import MasterDebtModal from '../components/modals/MasterDebtModal'

export default function MasterDebtsPage({ session }) {
  const {
    masterDebts,
    loading,
    modal,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDelete,
    handleViewLedger,
  } = useMasterDebts(session)
  const { debts } = useTransactions(session)

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
        onSubmit={handleSubmit}
      />
    </>
  )
}
