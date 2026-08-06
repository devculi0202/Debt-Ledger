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
          isMobileOpen={isMobileNavOpen}
          onMobileClose={onCloseMobileNav}
        />

        {isMobileNavOpen ? (
          <button
            type="button"
            aria-label={t('common.closeMenu')}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={onCloseMobileNav}
          />
        ) : null}

        <div className="flex-1 h-screen overflow-y-auto bg-neu-bg dark:bg-darkNeu-bg relative flex flex-col">
          <div className="md:hidden h-16 bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop-sm flex items-center justify-between px-6 sticky top-0 z-10 shrink-0 mb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenMobileNav}
                className="text-neu-textMuted w-8 h-8 rounded-full shadow-neu-drop flex justify-center items-center"
                aria-label={t('common.openMenu')}
              >
                <Menu className="w-4 h-4" />
              </button>
              <h1 className="text-lg font-bold flex items-center text-neu-textMain dark:text-darkNeu-textMain">
                <LedgerIcon className="text-neu-primary dark:text-darkNeu-textMain mr-2 w-5 h-5" />
                {t('nav.ledger')}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="compact" />
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="text-neu-textMuted w-8 h-8 rounded-full shadow-neu-drop flex justify-center items-center"
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
                className="text-neu-textMuted w-8 h-8 rounded-full shadow-neu-drop flex justify-center items-center hover:text-brand-negative"
                aria-label={t('common.signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-10 max-w-6xl mx-auto w-full flex-1">
            <Outlet />
          </div>

          <Footer className="shrink-0" />
        </div>
      </div>

      <VoiceDebtInputConnected />

      {!calcOpen && (
        <button
          type="button"
          onClick={() => setCalcOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-neu-primary text-white shadow-neu-drop dark:shadow-neu-dark-drop flex items-center justify-center hover:opacity-90 active:shadow-neu-inner transition-all-custom"
          aria-label={t('common.openCalculator')}
        >
          <CalcIcon className="w-6 h-6" />
        </button>
      )}

      <Calculator open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  )
}
