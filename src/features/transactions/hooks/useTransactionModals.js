import { useState } from 'react'

/**
 * Presentation state for create/edit transaction modal and duplicate-months modal.
 */
export default function useTransactionModals() {
  const [editingId, setEditingId] = useState(null)
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })
  const [duplicateModal, setDuplicateModal] = useState({
    open: false,
    source: null,
  })

  function openAdd() {
    setModal({ open: true, mode: 'create', data: null })
  }

  function openEdit(debt) {
    setEditingId(debt.id)
    setModal({ open: true, mode: 'edit', data: debt })
  }

  function closeModal() {
    setEditingId(null)
    setModal({ open: false, mode: 'create', data: null })
  }

  function openDuplicate(source) {
    setDuplicateModal({ open: true, source })
  }

  function closeDuplicateModal() {
    setDuplicateModal({ open: false, source: null })
  }

  return {
    editingId,
    modal,
    duplicateModal,
    openAdd,
    openEdit,
    closeModal,
    openDuplicate,
    closeDuplicateModal,
  }
}
