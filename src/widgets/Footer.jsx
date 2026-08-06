import { useLocale } from '@/shared/i18n'

export default function Footer({ className = '' }) {
  const { t } = useLocale()
  return (
    <footer className={`py-4 text-center text-xs text-neu-textMuted dark:text-darkNeu-textMuted ${className}`}>
      {t('footer.copyright')}
    </footer>
  )
}
