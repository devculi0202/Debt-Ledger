import useMasterDebts from '../hooks/useMasterDebts'
import useTransactions from '../hooks/useTransactions'
import TransactionLedger from '../components/TransactionLedger'
import TransactionModal from '../components/modals/TransactionModal'

export default function TransactionsPage({ session }) {
  const { masterDebts } = useMasterDebts(session)
  const {
    debts,
    loading,
    editingId,
    modal,
    openAdd,
    openEdit,
    closeModal,
    handleSubmit,
    handleTogglePaid,
    handleDelete,
  } = useTransactions(session)

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
      />
      <TransactionModal
        open={modal.open}
        mode={modal.mode}
        initialData={modal.data}
        masterDebts={masterDebts}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  )
}
