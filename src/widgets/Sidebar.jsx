import { NavLink } from 'react-router-dom'
import {
  PanelLeft,
  Menu,
  X,
  LayoutGrid,
  Layers,
  ArrowLeftRight,
  Bell,
  LogOut,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react'
import LedgerIcon from './LedgerIcon'
import LanguageSwitcher from '@/shared/ui/LanguageSwitcher'
import VoiceDebtInputConnected from '@/features/voice-debt/ui/VoiceDebtInputConnected'
import { useLocale } from '@/shared/i18n'

export default function Sidebar({
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
  isExpanded,
  onToggleExpand,
  isMobileOpen = false,
  onMobileClose,
}) {
  const { t } = useLocale()

  const linkClass = ({ isActive }) =>
    `nav-item w-full flex items-center gap-3 px-4 py-3 rounded-neu-md text-sm font-semibold transition-all-custom ${
      isActive
        ? 'bg-ink text-accent shadow-neu-drop-sm dark:bg-accent/10'
        : 'text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain hover:bg-neu-bg/70 dark:hover:bg-white/5'
    }`

  const utilityClass =
    'nav-item w-full flex items-center gap-3 px-4 py-3 rounded-neu-md text-sm font-semibold text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain hover:bg-neu-bg/70 dark:hover:bg-white/5 transition-all-custom cursor-pointer'

  // On mobile drawer, always show expanded labels for usability
  const showExpanded = isMobileOpen || isExpanded

  const groupLabel = (label) => (
    <p className="nav-group-label px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neu-textMuted/80">
      {label}
    </p>
  )

  return (
    <aside
      id="sidebar"
      className={`${showExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} bg-neu-surface dark:bg-darkNeu-surface border-r border-line dark:border-line-dark h-screen flex flex-col shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-40 ${
        isMobileOpen
          ? 'translate-x-0 pointer-events-auto'
          : '-translate-x-full pointer-events-none'
      } md:relative md:translate-x-0 md:pointer-events-auto md:z-20`}
    >
      <div className="h-20 flex items-center justify-between px-4 shrink-0 pt-2">
        <h1 className="text-base font-extrabold text-neu-textMain dark:text-darkNeu-textMain flex items-center overflow-hidden whitespace-nowrap sidebar-text pl-1 tracking-tight">
          <span className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center mr-2.5 shrink-0">
            <LedgerIcon className="text-accent w-5 h-5" />
          </span>
          {t('nav.ledger')}
        </h1>
        <button
          type="button"
          onClick={isMobileOpen ? onMobileClose : onToggleExpand}
          className="w-9 h-9 flex items-center justify-center rounded-full text-neu-textMuted border border-line dark:border-line-dark hover:bg-neu-bg/70 dark:hover:bg-white/5 transition shrink-0 cursor-pointer"
          aria-label={isMobileOpen ? t('common.closeMenu') : t('common.toggleSidebar')}
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

      <nav className="flex-1 overflow-y-auto py-2 px-3 overflow-x-hidden">
        {groupLabel(t('nav.groupMain'))}
        <div className="space-y-1">
          <NavLink
            to="/overview"
            title={t('nav.overview')}
            className={linkClass}
            onClick={onMobileClose}
          >
            <LayoutGrid className="w-[18px] h-[18px] shrink-0" />
            <span className="sidebar-text whitespace-nowrap">{t('nav.overview')}</span>
          </NavLink>
          <NavLink
            to="/master-debts"
            title={t('nav.debtAccounts')}
            className={linkClass}
            onClick={onMobileClose}
          >
            <Layers className="w-[18px] h-[18px] shrink-0" />
            <span className="sidebar-text whitespace-nowrap">{t('nav.debtAccounts')}</span>
          </NavLink>
        </div>

        {groupLabel(t('nav.groupMoney'))}
        <div className="space-y-1">
          <NavLink
            to="/transactions"
            title={t('nav.transactions')}
            className={linkClass}
            onClick={onMobileClose}
          >
            <ArrowLeftRight className="w-[18px] h-[18px] shrink-0" />
            <span className="sidebar-text whitespace-nowrap">{t('nav.transactions')}</span>
          </NavLink>
        </div>

        {groupLabel(t('nav.groupControl'))}
        <div className="space-y-1">
          <NavLink
            to="/reminders"
            title={t('nav.reminders')}
            className={linkClass}
            onClick={onMobileClose}
          >
            <Bell className="w-[18px] h-[18px] shrink-0" />
            <span className="sidebar-text whitespace-nowrap">{t('nav.reminders')}</span>
          </NavLink>
        </div>

        {groupLabel(t('nav.groupOther'))}
        <div className="space-y-1">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={utilityClass}
            title={t('common.toggleTheme')}
          >
            {isDarkMode ? (
              <Sun className="w-[18px] h-[18px] shrink-0" />
            ) : (
              <Moon className="w-[18px] h-[18px] shrink-0" />
            )}
            <span className="theme-btn-text sidebar-text whitespace-nowrap">
              {isDarkMode ? t('common.lightMode') : t('common.darkMode')}
            </span>
          </button>

          <LanguageSwitcher
            expanded={showExpanded}
            className="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-neu-md text-sm font-semibold text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain hover:bg-neu-bg/70 dark:hover:bg-white/5 transition-all-custom cursor-pointer"
          />

          <button
            type="button"
            onClick={onSignOut}
            className={`${utilityClass} hover:text-brand-negative dark:hover:text-brand-negative`}
            title={t('common.signOut')}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span className="sidebar-text whitespace-nowrap">{t('common.signOut')}</span>
          </button>
        </div>
      </nav>

      <div className="p-3 shrink-0 pb-4">
        <VoiceDebtInputConnected variant="assistant" />
        {!showExpanded ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-10 h-10 mx-auto rounded-full bg-accent text-ink flex items-center justify-center hover:brightness-95 transition cursor-pointer"
            aria-label={t('voice.assistantTitle')}
            title={t('voice.assistantTitle')}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </aside>
  )
}
