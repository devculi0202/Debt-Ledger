import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  Outlet,
} from 'react-router-dom'
import { Moon, Scale, LogOut } from 'lucide-react'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { supabase } from './lib/supabase'
import { isSettled } from './lib/format'
import Sidebar from './components/Sidebar'
import MasterDebtList from './components/MasterDebtList'
import TransactionLedger from './components/TransactionLedger'
import MasterDebtModal from './components/modals/MasterDebtModal'
import TransactionModal from './components/modals/TransactionModal'

function getInitialDarkMode() {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function AuthenticatedShell({
  userName,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
  isSidebarExpanded,
  onToggleExpand,
  masterModal,
  onCloseMasterModal,
  onSubmitMasterModal,
  transactionModal,
  masterDebts,
  onCloseTransactionModal,
  onSubmitTransactionModal,
}) {
  return (
    <div className="bg-neu-bg dark:bg-darkNeu-bg text-neu-textMain dark:text-darkNeu-textMain min-h-screen transition-all-custom flex overflow-hidden relative">
      <div className="flex-1 flex h-screen w-full overflow-hidden">
        <Sidebar
          userName={userName}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          onSignOut={onSignOut}
          isExpanded={isSidebarExpanded}
          onToggleExpand={onToggleExpand}
        />

        <div className="flex-1 h-screen overflow-y-auto bg-neu-bg dark:bg-darkNeu-bg relative flex flex-col">
          <div className="md:hidden h-16 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop-sm flex items-center justify-between px-6 sticky top-0 z-10 shrink-0 mb-4">
            <h1 className="text-lg font-bold flex items-center text-neu-textMain dark:text-darkNeu-textMain">
              <Scale className="text-neu-primary dark:text-darkNeu-textMain mr-2 w-5 h-5" />
              Ledger
            </h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="text-neu-textMuted w-8 h-8 rounded-full shadow-neu-drop flex justify-center items-center"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="text-neu-textMuted w-8 h-8 rounded-full shadow-neu-drop flex justify-center items-center hover:text-brand-negative"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-10 max-w-6xl mx-auto w-full flex-1">
            <Outlet />
          </div>
        </div>
      </div>

      <MasterDebtModal
        open={masterModal.open}
        mode={masterModal.mode}
        initialData={masterModal.data}
        onClose={onCloseMasterModal}
        onSubmit={onSubmitMasterModal}
      />

      <TransactionModal
        open={transactionModal.open}
        mode={transactionModal.mode}
        initialData={transactionModal.data}
        masterDebts={masterDebts}
        onClose={onCloseTransactionModal}
        onSubmit={onSubmitTransactionModal}
      />
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [session, setSession] = useState(undefined)
  const [debts, setDebts] = useState([])
  const [masterDebts, setMasterDebts] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [loadingMaster, setLoadingMaster] = useState(false)
  const [loadingDebts, setLoadingDebts] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  const [masterModal, setMasterModal] = useState({
    open: false,
    mode: 'create',
    data: null,
  })
  const [transactionModal, setTransactionModal] = useState({
    open: false,
    mode: 'create',
    data: null,
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'SIGNED_IN' && nextSession) {
        navigate('/master-debts', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  useEffect(() => {
    if (!session) {
      setDebts([])
      setMasterDebts([])
      return
    }

    fetchMasterDebts()
    fetchDebts()
  }, [session])

  async function fetchMasterDebts() {
    setLoadingMaster(true)
    const { data, error } = await supabase
      .from('debt_accounts')
      .select('*')
      .order('created_at', { ascending: false })
    setLoadingMaster(false)
    if (error) {
      setMasterDebts([])
      return
    }
    setMasterDebts(data || [])
  }

  async function fetchDebts() {
    setLoadingDebts(true)
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false })
    setLoadingDebts(false)
    if (error) {
      alert('Database connection failed.')
      return
    }
    setDebts(data || [])
  }

  async function signInWithGithub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })
    if (error) alert(error.message)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert(error.message)
      return
    }
    navigate('/login', { replace: true })
  }

  async function handleCreateMasterDebt(payload) {
    const { error } = await supabase.from('debt_accounts').insert([
      {
        ...payload,
        user_id: session.user.id,
      },
    ])
    if (error) {
      alert('Failed to create account.')
      return
    }
    setMasterModal({ open: false, mode: 'create', data: null })
    await fetchMasterDebts()
  }

  async function handleUpdateMasterDebt(payload) {
    const { error } = await supabase
      .from('debt_accounts')
      .update(payload)
      .eq('id', masterModal.data.id)
    if (error) {
      alert('Failed to update account.')
      return
    }
    setMasterModal({ open: false, mode: 'create', data: null })
    await fetchMasterDebts()
    await fetchDebts()
  }

  async function handleDeleteMasterDebt(id) {
    if (
      !confirm(
        'Delete this Master Account? Linked transactions will NOT be deleted, but they will become unlinked.',
      )
    ) {
      return
    }
    await supabase.from('debts').update({ account_id: null }).eq('account_id', id)
    const { error } = await supabase.from('debt_accounts').delete().eq('id', id)
    if (error) {
      alert('Error deleting account.')
      return
    }
    await fetchMasterDebts()
    await fetchDebts()
  }

  async function handleCreateTransaction(payload) {
    const { error } = await supabase.from('debts').insert([
      {
        ...payload,
        paid: false,
      },
    ])
    if (error) {
      alert('Database Error: ' + error.message)
      return
    }
    setTransactionModal({ open: false, mode: 'create', data: null })
    await fetchDebts()
  }

  async function handleUpdateTransaction(payload) {
    const existing = debts.find((d) => d.id === transactionModal.data?.id)
    const { error } = await supabase
      .from('debts')
      .update({
        ...payload,
        paid: existing?.paid ?? false,
      })
      .eq('id', transactionModal.data.id)
    if (error) {
      alert('Database Error: ' + error.message)
      return
    }
    setEditingId(null)
    setTransactionModal({ open: false, mode: 'create', data: null })
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
    const { error } = await supabase
      .from('debts')
      .update({ paid: newStatus })
      .eq('id', id)
    if (error) {
      setDebts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, paid: currentStatus } : d)),
      )
    }
  }

  async function handleDeleteDebt(id) {
    if (!confirm('Delete this record? Action cannot be undone.')) return
    if (editingId === id) {
      setEditingId(null)
      setTransactionModal({ open: false, mode: 'create', data: null })
    }
    const backup = debts
    setDebts((prev) => prev.filter((d) => d.id !== id))
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (error) {
      setDebts(backup)
    }
  }

  function handleViewLedger(account) {
    setMonthFilter('all')
    setStatusFilter('settled')
    setSearchQuery(account.name)
    navigate('/transactions')
  }

  const userName =
    session?.user?.user_metadata?.user_name || session?.user?.email || 'User'

  if (session === undefined) {
    return (
      <div className="bg-neu-bg dark:bg-darkNeu-bg min-h-screen flex items-center justify-center text-neu-textMuted dark:text-darkNeu-textMuted">
        Loading…
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? (
            <Navigate to="/master-debts" replace />
          ) : (
            <LoginPage onSignIn={signInWithGithub} />
          )
        }
      />
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/master-debts" replace />
          ) : (
            <LoginPage onSignIn={signInWithGithub} />
          )
        }
      />

      <Route element={<ProtectedRoute session={session} />}>
        <Route
          element={
            <AuthenticatedShell
              userName={userName}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode((v) => !v)}
              onSignOut={signOut}
              isSidebarExpanded={isSidebarExpanded}
              onToggleExpand={() => setIsSidebarExpanded((v) => !v)}
              masterModal={masterModal}
              onCloseMasterModal={() =>
                setMasterModal({ open: false, mode: 'create', data: null })
              }
              onSubmitMasterModal={
                masterModal.mode === 'edit'
                  ? handleUpdateMasterDebt
                  : handleCreateMasterDebt
              }
              transactionModal={transactionModal}
              masterDebts={masterDebts}
              onCloseTransactionModal={() => {
                setEditingId(null)
                setTransactionModal({ open: false, mode: 'create', data: null })
              }}
              onSubmitTransactionModal={
                transactionModal.mode === 'edit'
                  ? handleUpdateTransaction
                  : handleCreateTransaction
              }
            />
          }
        >
          <Route
            path="/master-debts"
            element={
              <MasterDebtList
                masterDebts={masterDebts}
                debts={debts}
                loading={loadingMaster}
                onOpenCreate={() =>
                  setMasterModal({ open: true, mode: 'create', data: null })
                }
                onEdit={(account) =>
                  setMasterModal({ open: true, mode: 'edit', data: account })
                }
                onDelete={handleDeleteMasterDebt}
                onViewLedger={handleViewLedger}
              />
            }
          />
          <Route
            path="/transactions"
            element={
              <TransactionLedger
                debts={debts}
                masterDebts={masterDebts}
                loading={loadingDebts}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                monthFilter={monthFilter}
                editingId={editingId}
                onSearchChange={setSearchQuery}
                onStatusFilterChange={setStatusFilter}
                onMonthFilterChange={setMonthFilter}
                onOpenAdd={() =>
                  setTransactionModal({
                    open: true,
                    mode: 'create',
                    data: null,
                  })
                }
                onTogglePaid={handleTogglePaid}
                onEdit={(debt) => {
                  setEditingId(debt.id)
                  setTransactionModal({
                    open: true,
                    mode: 'edit',
                    data: debt,
                  })
                }}
                onDelete={handleDeleteDebt}
              />
            }
          />
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
