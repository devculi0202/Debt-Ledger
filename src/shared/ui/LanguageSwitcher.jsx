import { Languages, ChevronDown } from 'lucide-react'
import { useLocale, SUPPORTED_LOCALES } from '@/shared/i18n'

const LOCALE_LABEL_KEYS = {
  vi: 'common.vietnamese',
  en: 'common.english',
}

/**
 * Language select used in sidebar, login, and mobile header.
 * variant: "sidebar" | "compact" | "inline"
 */
export default function LanguageSwitcher({
  className = '',
  expanded = true,
  variant = 'sidebar',
}) {
  const { locale, setLocale, t } = useLocale()

  const options = SUPPORTED_LOCALES.map((code) => (
    <option key={code} value={code}>
      {t(LOCALE_LABEL_KEYS[code])}
    </option>
  ))

  if (variant === 'compact') {
    return (
      <label
        className={`relative inline-flex items-center ${className}`}
        title={t('common.language')}
      >
        <span className="sr-only">{t('common.language')}</span>
        <Languages className="pointer-events-none absolute left-2 w-3.5 h-3.5 text-neu-textMuted" />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          aria-label={t('common.language')}
          className="appearance-none bg-transparent text-neu-textMuted text-[10px] font-bold uppercase tracking-wide pl-7 pr-5 py-1.5 rounded-full shadow-neu-drop outline-none cursor-pointer border-none"
        >
          {options}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 w-3 h-3 text-neu-textMuted" />
      </label>
    )
  }

  const shellClass =
    className ||
    (variant === 'inline'
      ? 'flex items-center gap-2 px-4 py-2.5 rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop text-sm font-medium text-neu-textMuted'
      : 'w-full flex items-center gap-3 px-4 py-3.5 rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop text-sm font-medium text-neu-textMuted')

  return (
    <label className={`relative ${shellClass}`} title={t('common.language')}>
      <Languages className="w-4 h-4 shrink-0 pointer-events-none" />
      {expanded || variant === 'inline' ? (
        <>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label={t('common.language')}
            className="flex-1 min-w-0 bg-transparent outline-none border-none appearance-none cursor-pointer text-neu-textMuted font-medium text-sm pr-5"
          >
            {options}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 w-4 h-4 text-neu-textMuted" />
        </>
      ) : (
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          aria-label={t('common.language')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {options}
        </select>
      )}
    </label>
  )
}
