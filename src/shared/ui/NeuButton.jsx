export default function NeuButton({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const base =
    'px-5 py-3 text-sm font-semibold rounded-neu-md transition-all-custom flex items-center gap-2 cursor-pointer'
  const variants = {
    default:
      'bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain border border-line dark:border-line-dark shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm hover:bg-neu-bg/60 dark:hover:bg-white/5 active:scale-[0.98]',
    primary:
      'bg-ink text-white dark:bg-accent dark:text-ink shadow-neu-drop-sm hover:opacity-90 active:scale-[0.98]',
    accent:
      'bg-accent text-ink shadow-neu-drop-sm hover:brightness-95 active:scale-[0.98]',
  }

  return (
    <button
      type="button"
      className={`${base} ${variants[variant] ?? variants.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
