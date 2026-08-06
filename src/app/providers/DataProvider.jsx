import { createContext, useContext } from 'react'

const SessionContext = createContext(null)

/**
 * Provides the authenticated session only.
 * Domain lists are loaded via TanStack Query in feature hooks when pages mount.
 */
export function DataProvider({ session, children }) {
  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  )
}

export function useSessionData() {
  const session = useContext(SessionContext)
  if (session === null) {
    throw new Error('useSessionData must be used within DataProvider')
  }
  return session
}
