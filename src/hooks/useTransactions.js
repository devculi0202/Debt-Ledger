import { useEffect, useState, useCallback } from 'react'
import * as transactionsService from '../services/transactions'
import { isSettled } from '../lib/format'

export default function useTransactions(session) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await transactionsService.fetchAll()
    setLoading(false)
    if (error) {
      alert('Database connection failed.')
      return
    }
    setDebts(data || [])
  }, [])

  useEffect(() => {
    if (!session) {
      setDebts([])
      return
    }
    fetchDebts()
  }, [session, fetchDebts])

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

  async function handleCreate(payload) {
    const { error } = await transactionsService.create(payload)
    if (error) {
      alert('Database Error: ' + error.message)
      return
    }
    closeModal()
    await fetchDebts()
  }

  async function handleUpdate(payload) {
    const existing = debts.find((d) => d.id === modal.data?.id)
    const { error } = await transactionsService.update(modal.data.id, {
      ...payload,
      paid: existing?.paid ?? false,
    })
    if (error) {
      alert('Database Error: ' + error.message)
      return
    }
    closeModal()
    await fetchDebts()
  }

  async function handleTogglePaid(id) {
    const debt = debts.find((d) => d.id === id)
    if (!debt) return
    const currentStatus = isSettled(debt.paid)
    const newStatus = !currentStatus
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, paid: newStatus } : d)),
    )
    const { error } = await transactionsService.togglePaid(id, newStatus)
    if (error) {
      setDebts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, paid: currentStatus } : d)),
      )
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this record? Action cannot be undone.')) return
    if (editingId === id) {
      closeModal()
    }
    const backup = debts
    setDebts((prev) => prev.filter((d) => d.id !== id))
    const { error } = await transactionsService.remove(id)
    if (error) {
      setDebts(backup)
    }
  }

  const handleSubmit = modal.mode === 'edit' ? handleUpdate : handleCreate

  return {
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
    refetch: fetchDebts,
  }
}
