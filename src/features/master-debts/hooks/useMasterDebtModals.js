import { useState } from 'react'

/**
 * Presentation state for create/edit master-debt account modal.
 */
export default function useMasterDebtModals() {
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })

  function openCreate() {
    setModal({ open: true, mode: 'create', data: null })
  }

  function openEdit(account) {
    setModal({ open: true, mode: 'edit', data: account })
  }

  function closeModal() {
    setModal({ open: false, mode: 'create', data: null })
  }

  return {
    modal,
    openCreate,
    openEdit,
    closeModal,
  }
}
