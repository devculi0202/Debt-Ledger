import useMasterDebtsQuery from './useMasterDebtsQuery'
import useMasterDebtModals from './useMasterDebtModals'
import { useSessionData } from '@/app/providers/DataProvider'

/**
 * Feature composition for the master-debts page: query + mutations + modals.
 */
export default function useMasterDebts() {
  const session = useSessionData()
  const query = useMasterDebtsQuery(session)
  const modals = useMasterDebtModals()

  async function handleCreate(payload) {
    await query.create(payload)
    modals.closeModal()
  }

  async function handleUpdate(payload) {
    await query.update(modals.modal.data.id, payload)
    modals.closeModal()
  }

  async function handleDelete(id) {
    await query.remove(id)
  }

  const handleSubmit =
    modals.modal.mode === 'edit' ? handleUpdate : handleCreate

  return {
    masterDebts: query.masterDebts,
    loading: query.loading,
    modal: modals.modal,
    openCreate: modals.openCreate,
    openEdit: modals.openEdit,
    closeModal: modals.closeModal,
    handleSubmit,
    handleDelete,
    refetch: query.refetch,
  }
}
