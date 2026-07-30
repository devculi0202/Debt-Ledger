import { useEffect, useState, useCallback } from 'react'
import * as transactionsService from '../services/transactions'
import { mapVoiceDebtToTransaction } from '../lib/voiceDebtMapper'
import { isSettled } from '../lib/format'
import logger from '../lib/logger'

export default function useTransactions(session) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })
  const [duplicateModal, setDuplicateModal] = useState({ open: false, source: null })

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await transactionsService.fetchAll()
    setLoading(false)
    if (error) {
      logger.error('Database connection failed', 'transactions', error)
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

  function openDuplicate(source) {
    setDuplicateModal({ open: true, source })
  }

  function closeDuplicateModal() {
    setDuplicateModal({ open: false, source: null })
  }

  async function handleCreate(payload) {
    const { error } = await transactionsService.create(payload)
    if (error) throw error
    closeModal()
    await fetchDebts()
  }

  async function createFromVoice(apiResponse) {
    const payload = mapVoiceDebtToTransaction(apiResponse)
    const { error } = await transactionsService.create(payload)
    if (error) throw error
    await fetchDebts()
  }

  async function handleUpdate(payload) {
    const existing = debts.find((d) => d.id === modal.data?.id)
    const { error } = await transactionsService.update(modal.data.id, {
      ...payload,
      paid: existing?.paid ?? false,
    })
    if (error) throw error
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
      logger.error(`Toggle paid failed for ${id}`, 'transactions', error)
      setDebts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, paid: currentStatus } : d)),
      )
    }
  }

  async function handleDuplicateMonths(payloads) {
    const { error } = await transactionsService.createMany(payloads)
    if (error) throw error
    closeDuplicateModal()
    await fetchDebts()
  }

  async function handleDelete(id) {
    if (editingId === id) {
      closeModal()
    }
    const backup = debts
    setDebts((prev) => prev.filter((d) => d.id !== id))
    const { error } = await transactionsService.remove(id)
    if (error) {
      logger.error(`Delete failed for ${id}`, 'transactions', error)
      setDebts(backup)
      throw error
    }
  }

  const handleSubmit = modal.mode === 'edit' ? handleUpdate : handleCreate

  return {
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
    handleDelete,
    handleDuplicateMonths,
    createFromVoice,
    refetch: fetchDebts,
  }
}
