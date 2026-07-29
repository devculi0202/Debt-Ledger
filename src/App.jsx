import { useEffect, useState } from 'react'
import { Moon, Scale, LogOut } from 'lucide-react'

function GitHubIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
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

export default function App() {
  const [session, setSession] = useState(null)
  const [debts, setDebts] = useState([])
  const [masterDebts, setMasterDebts] = useState([])
  const [activeTab, setActiveTab] = useState('master-debt')
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
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        setActiveTab('master-debt')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
    if (error) alert(error.message)
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
    setActiveTab('debt-details')
    setMonthFilter('all')
    setStatusFilter('settled')
    setSearchQuery(account.name)
  }

  const userName =
    session?.user?.user_metadata?.user_name || session?.user?.email || 'User'

  if (!session) {
    return (
      <div className="bg-neu-bg dark:bg-darkNeu-bg text-neu-textMain dark:text-darkNeu-textMain min-h-screen transition-all-custom flex overflow-hidden relative">
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-neu-bg dark:bg-darkNeu-bg transition-opacity duration-300">
          <div className="bg-neu-surface dark:bg-darkNeu-surface p-8 md:p-12 rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop mb-2">
              <Scale className="w-8 h-8 text-neu-primary dark:text-darkNeu-textMain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-neu-textMuted dark:text-darkNeu-textMuted mt-2 text-sm">
                Sign in to manage your financial ledgers.
              </p>
            </div>
            <button
              type="button"
              onClick={signInWithGithub}
              className="w-full flex items-center justify-center gap-3 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop dark:shadow-neu-dark-drop hover:shadow-neu-inner dark:hover:shadow-neu-dark-inner font-semibold py-3 px-4 rounded-neu-md transition-all-custom"
            >
              <GitHubIcon className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-neu-bg dark:bg-darkNeu-bg text-neu-textMain dark:text-darkNeu-textMain min-h-screen transition-all-custom flex overflow-hidden relative">
      <div className="flex-1 flex h-screen w-full overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userName={userName}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((v) => !v)}
          onSignOut={signOut}
          isExpanded={isSidebarExpanded}
          onToggleExpand={() => setIsSidebarExpanded((v) => !v)}
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
                onClick={() => setIsDarkMode((v) => !v)}
                className="text-neu-textMuted w-8 h-8 rounded-full shadow-neu-drop flex justify-center items-center"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={signOut}
                className="text-neu-textMuted w-8 h-8 rounded-full shadow-neu-drop flex justify-center items-center hover:text-brand-negative"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-10 max-w-6xl mx-auto w-full flex-1">
            {activeTab === 'master-debt' ? (
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
            ) : (
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
            )}
          </div>
        </div>
      </div>

      <MasterDebtModal
        open={masterModal.open}
        mode={masterModal.mode}
        initialData={masterModal.data}
        onClose={() =>
          setMasterModal({ open: false, mode: 'create', data: null })
        }
        onSubmit={
          masterModal.mode === 'edit'
            ? handleUpdateMasterDebt
            : handleCreateMasterDebt
        }
      />

      <TransactionModal
        open={transactionModal.open}
        mode={transactionModal.mode}
        initialData={transactionModal.data}
        masterDebts={masterDebts}
        onClose={() => {
          setEditingId(null)
          setTransactionModal({ open: false, mode: 'create', data: null })
        }}
        onSubmit={
          transactionModal.mode === 'edit'
            ? handleUpdateTransaction
            : handleCreateTransaction
        }
      />
    </div>
  )
}
