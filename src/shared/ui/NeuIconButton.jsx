export default function NeuIconButton({
  children,
  className = '',
  size = 'md',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  return (
    <button
      type="button"
      className={`${sizeClass} rounded-full bg-neu-surface dark:bg-darkNeu-surface border border-line dark:border-line-dark text-neu-textMuted hover:bg-neu-bg/70 dark:hover:bg-white/5 active:scale-95 transition inline-flex justify-center items-center cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
