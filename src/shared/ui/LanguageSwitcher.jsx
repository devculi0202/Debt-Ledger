import { Languages } from 'lucide-react'
import { useLocale } from '@/shared/i18n'

/** Compact language toggle used in sidebar and login. */
export default function LanguageSwitcher({ className = '', expanded = true }) {
  const { locale, toggleLocale, t } = useLocale()
  const label = locale === 'vi' ? t('common.english') : t('common.vietnamese')

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={
        className ||
        'w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-sm font-medium text-neu-textMuted transition-all-custom'
      }
      title={t('common.language')}
      aria-label={t('common.language')}
    >
      <Languages className="w-4 h-4 shrink-0" />
      {expanded ? (
        <span className="theme-btn-text sidebar-text whitespace-nowrap">
          {label}
        </span>
      ) : null}
    </button>
  )
}
