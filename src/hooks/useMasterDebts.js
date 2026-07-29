import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as debtAccountsService from '../services/debtAccounts'
import { viewLedgerPath } from '../lib/transactionFilters'
import logger from '../lib/logger'

export default function useMasterDebts(session) {
  const navigate = useNavigate()
  const [masterDebts, setMasterDebts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })

  const fetchMasterDebts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await debtAccountsService.fetchAll()
    setLoading(false)
    if (error) {
      logger.error('Failed to fetch accounts', 'useMasterDebts', error)
      setMasterDebts([])
      return
    }
    setMasterDebts(data || [])
  }, [])

  useEffect(() => {
    if (!session) {
      setMasterDebts([])
      return
    }
    fetchMasterDebts()
  }, [session, fetchMasterDebts])

  function openCreate() {
    setModal({ open: true, mode: 'create', data: null })
  }

  function openEdit(account) {
    setModal({ open: true, mode: 'edit', data: account })
  }

  function closeModal() {
    setModal({ open: false, mode: 'create', data: null })
  }

  async function handleCreate(payload) {
    const { error } = await debtAccountsService.create(payload, session.user.id)
    if (error) throw error
    closeModal()
    await fetchMasterDebts()
  }

  async function handleUpdate(payload) {
    const { error } = await debtAccountsService.update(modal.data.id, payload)
    if (error) throw error
    closeModal()
    await fetchMasterDebts()
  }

  async function handleDelete(id) {
    await debtAccountsService.unlinkTransactions(id)
    const { error } = await debtAccountsService.remove(id)
    if (error) throw error
    await fetchMasterDebts()
  }

  function handleViewLedger(account) {
    navigate(viewLedgerPath(account.id))
  }

  const handleSubmit = modal.mode === 'edit' ? handleUpdate : handleCreate

  return {
    masterDebts,
    loading,
    modal,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDelete,
    handleViewLedger,
    refetch: fetchMasterDebts,
  }
}
