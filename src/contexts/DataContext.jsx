import { createContext, useContext } from 'react'
import useMasterDebts from '../hooks/useMasterDebts'
import useTransactions from '../hooks/useTransactions'

const DataContext = createContext(null)

export function DataProvider({ session, children }) {
  const masterDebtsHook = useMasterDebts(session)
  const transactionsHook = useTransactions(session)

  return (
    <DataContext.Provider value={{ masterDebtsHook, transactionsHook }}>
      {children}
    </DataContext.Provider>
  )
}

export function useMasterDebtsData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useMasterDebtsData must be used within DataProvider')
  return ctx.masterDebtsHook
}

export function useTransactionsData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useTransactionsData must be used within DataProvider')
  return ctx.transactionsHook
}
