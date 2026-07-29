import { NavLink } from 'react-router-dom'
import {
  Scale,
  PanelLeft,
  Menu,
  X,
  Layers,
  List,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'

export default function Sidebar({
  userName,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
  isExpanded,
  onToggleExpand,
  isMobileOpen = false,
  onMobileClose,
}) {
  const navActive =
    'shadow-neu-inner dark:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain'
  const navInactive =
    'shadow-none text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain'

  const linkClass = ({ isActive }) =>
    `nav-item w-full flex items-center gap-4 px-4 py-3.5 rounded-neu-md font-medium transition-all-custom ${
      isActive ? navActive : navInactive
    }`

  // On mobile drawer, always show expanded labels for usability
  const showExpanded = isMobileOpen || isExpanded

  return (
    <aside
      id="sidebar"
      className={`${showExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} bg-neu-surface dark:bg-darkNeu-surface shadow-[6px_0_16px_rgba(174,190,205,0.3)] dark:shadow-[5px_0_15px_rgba(0,0,0,0.5)] h-screen flex flex-col shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-40 ${
        isMobileOpen
          ? 'translate-x-0 pointer-events-auto'
          : '-translate-x-full pointer-events-none'
      } md:relative md:translate-x-0 md:pointer-events-auto md:z-20`}
    >
      <div className="h-20 flex items-center justify-between px-6 shrink-0 pt-4">
        <h1 className="text-xl font-bold text-neu-textMain dark:text-darkNeu-textMain flex items-center overflow-hidden whitespace-nowrap sidebar-text pl-2">
          <Scale className="text-neu-primary dark:text-darkNeu-textMain mr-3 w-5 h-5" />
          Ledger
        </h1>
        <button
          type="button"
          onClick={isMobileOpen ? onMobileClose : onToggleExpand}
          className="w-10 h-10 flex items-center justify-center rounded-full text-neu-textMuted shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner transition shrink-0"
          aria-label={isMobileOpen ? 'Close menu' : 'Toggle sidebar'}
        >
          {isMobileOpen ? (
            <X className="w-4 h-4" />
          ) : isExpanded ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-4 overflow-x-hidden">
        <NavLink
          to="/master-debts"
          title="Debt Accounts"
          className={linkClass}
          onClick={onMobileClose}
        >
          <Layers className="w-5 h-5 shrink-0" />
          <span className="sidebar-text whitespace-nowrap">Master Debts</span>
        </NavLink>

        <NavLink
          to="/transactions"
          title="Transactions"
          className={linkClass}
          onClick={onMobileClose}
        >
          <List className="w-5 h-5 shrink-0" />
          <span className="sidebar-text whitespace-nowrap">Transactions</span>
        </NavLink>
      </nav>

      <div className="p-6 shrink-0 pb-8 space-y-6">
        <div className="flex items-center justify-between user-info">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner flex items-center justify-center text-neu-primary dark:text-darkNeu-textMain font-bold text-sm shrink-0">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-neu-textMain dark:text-darkNeu-textMain whitespace-nowrap truncate">
              {userName || 'User'}
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-10 h-10 rounded-full shadow-neu-drop dark:shadow-neu-dark-drop flex items-center justify-center text-neu-textMuted hover:text-brand-negative active:shadow-neu-inner transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-sm font-medium text-neu-textMuted transition-all-custom"
          title="Toggle Theme"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          <span className="theme-btn-text sidebar-text whitespace-nowrap">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </aside>
  )
}
