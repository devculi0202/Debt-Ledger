import useTransactionsQuery from './useTransactionsQuery'
import useTransactionModals from './useTransactionModals'
import { useSessionData } from '@/app/providers/DataProvider'

/**
 * Feature composition for the transactions page: query + mutations + modals.
 */
export default function useTransactions() {
  const session = useSessionData()
  const query = useTransactionsQuery(session)
  const modals = useTransactionModals()

  async function handleCreate(payload) {
    await query.create(payload)
    modals.closeModal()
  }

  async function handleUpdate(payload) {
    const existing = query.debts.find((d) => d.id === modals.modal.data?.id)
    await query.update(modals.modal.data.id, payload, {
      paid: existing?.paid ?? false,
    })
    modals.closeModal()
  }

  async function handleDuplicateMonths(payloads) {
    await query.createMany(payloads)
    modals.closeDuplicateModal()
  }

  async function handleDelete(id) {
    if (modals.editingId === id) {
      modals.closeModal()
    }
    await query.remove(id)
  }

  const handleSubmit =
    modals.modal.mode === 'edit' ? handleUpdate : handleCreate

  return {
    debts: query.debts,
    loading: query.loading,
    editingId: modals.editingId,
    modal: modals.modal,
    duplicateModal: modals.duplicateModal,
    openAdd: modals.openAdd,
    openEdit: modals.openEdit,
    closeModal: modals.closeModal,
    openDuplicate: modals.openDuplicate,
    closeDuplicateModal: modals.closeDuplicateModal,
    handleSubmit,
    handleTogglePaid: query.togglePaid,
    handleDelete,
    handleDuplicateMonths,
    createFromVoice: query.createFromVoice,
    refetch: query.refetch,
  }
}
