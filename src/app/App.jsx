import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import MasterDebtsPage from '@/pages/MasterDebtsPage'
import TransactionsPage from '@/pages/TransactionsPage'
import RemindersPage from '@/pages/RemindersPage'
import ProtectedRoute from '@/features/auth/ui/ProtectedRoute'
import { DataProvider } from '@/app/providers/DataProvider'
import AuthenticatedShell from '@/app/layouts/AuthenticatedShell'
import useAuth from '@/features/auth/hooks/useAuth'
import useTheme from '@/shared/hooks/useTheme'

export default function App() {
  const { session, userName, signIn, signOut } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  if (session === undefined) {
    return (
      <div className="bg-neu-bg dark:bg-darkNeu-bg min-h-screen flex items-center justify-center text-neu-textMuted dark:text-darkNeu-textMuted">
        Loading…
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/master-debts" replace />
          ) : (
            <LoginPage onSignIn={signIn} />
          )
        }
      />

      <Route element={<ProtectedRoute session={session} />}>
        <Route
          element={
            <DataProvider session={session}>
              <AuthenticatedShell
                userName={userName}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                onSignOut={signOut}
                isSidebarExpanded={isSidebarExpanded}
                onToggleExpand={() => setIsSidebarExpanded((v) => !v)}
                isMobileNavOpen={isMobileNavOpen}
                onOpenMobileNav={() => setIsMobileNavOpen(true)}
                onCloseMobileNav={() => setIsMobileNavOpen(false)}
              />
            </DataProvider>
          }
        >
          <Route path="/master-debts" element={<MasterDebtsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={session ? '/master-debts' : '/login'} replace />
        }
      />
    </Routes>
  )
}
