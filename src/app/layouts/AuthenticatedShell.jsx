import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Moon, Sun, LogOut, Menu, Calculator as CalcIcon } from 'lucide-react'
import LedgerIcon from '@/widgets/LedgerIcon'
import Calculator from '@/features/calculator/ui/Calculator'
import VoiceDebtInputConnected from '@/features/voice-debt/ui/VoiceDebtInputConnected'
import Sidebar from '@/widgets/Sidebar'
import Footer from '@/widgets/Footer'
import LanguageSwitcher from '@/shared/ui/LanguageSwitcher'
import { useLocale } from '@/shared/i18n'

export default function AuthenticatedShell({
  userName,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
  isSidebarExpanded,
  onToggleExpand,
  isMobileNavOpen,
  onOpenMobileNav,
  onCloseMobileNav,
}) {
  const [calcOpen, setCalcOpen] = useState(false)
  const { t } = useLocale()

  const iconBtn =
    'w-10 h-10 rounded-full bg-neu-surface dark:bg-darkNeu-surface border border-line dark:border-line-dark flex justify-center items-center text-neu-textMuted hover:text-neu-textMain dark:hover:text-darkNeu-textMain transition cursor-pointer'

  return (
    <div className="bg-neu-bg dark:bg-darkNeu-bg text-neu-textMain dark:text-darkNeu-textMain min-h-screen transition-all-custom flex overflow-hidden relative">
      <div className="flex-1 flex h-screen w-full overflow-hidden">
        <Sidebar
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          onSignOut={onSignOut}
          isExpanded={isSidebarExpanded}
          onToggleExpand={onToggleExpand}
          isMobileOpen={isMobileNavOpen}
          onMobileClose={onCloseMobileNav}
        />

        {isMobileNavOpen ? (
          <button
            type="button"
            aria-label={t('common.closeMenu')}
            className="fixed inset-0 z-30 bg-ink/40 md:hidden"
            onClick={onCloseMobileNav}
          />
        ) : null}

        <div className="flex-1 h-screen overflow-y-auto bg-neu-bg dark:bg-darkNeu-bg relative flex flex-col">
          {/* Mobile top bar */}
          <div className="md:hidden h-16 bg-neu-surface dark:bg-darkNeu-surface border-b border-line dark:border-line-dark flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenMobileNav}
                className={`${iconBtn} w-9 h-9`}
                aria-label={t('common.openMenu')}
              >
                <Menu className="w-4 h-4" />
              </button>
              <h1 className="text-base font-extrabold flex items-center text-neu-textMain dark:text-darkNeu-textMain tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center mr-2">
                  <LedgerIcon className="text-accent w-4 h-4" />
                </span>
                {t('nav.ledger')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="compact" />
              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`${iconBtn} w-9 h-9`}
                aria-label={t('common.toggleTheme')}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className={`${iconBtn} w-9 h-9 hover:text-brand-negative dark:hover:text-brand-negative`}
                aria-label={t('common.signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 md:p-8 max-w-7xl mx-auto w-full flex-1">
            {/* Welcome header */}
            <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-ink text-accent flex items-center justify-center font-bold text-lg shrink-0">
                  {(userName || t('common.user')).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-neu-textMain dark:text-darkNeu-textMain truncate">
                    {t('common.welcome', { name: userName || t('common.user') })}
                  </h2>
                  <p className="text-xs md:text-sm text-neu-textMuted truncate">
                    {t('common.headerSubtitle')}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCalcOpen(true)}
                  className={iconBtn}
                  aria-label={t('common.openCalculator')}
                >
                  <CalcIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className={iconBtn}
                  aria-label={t('common.toggleTheme')}
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Outlet />
          </div>

          <Footer className="shrink-0" />
        </div>
      </div>

      {/* Mobile-only voice FAB (desktop uses the sidebar AI Assistant card) */}
      <VoiceDebtInputConnected />

      {!calcOpen && (
        <button
          type="button"
          onClick={() => setCalcOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-ink text-accent shadow-neu-drop dark:shadow-neu-dark-drop flex items-center justify-center hover:opacity-90 active:scale-95 transition-all-custom cursor-pointer"
          aria-label={t('common.openCalculator')}
        >
          <CalcIcon className="w-6 h-6" />
        </button>
      )}

      <Calculator open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  )
}
