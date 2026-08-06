export default function NeuButton({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const base =
    'px-5 py-3 text-sm font-bold rounded-neu-md transition-all-custom flex items-center gap-2'
  const variants = {
    default:
      'bg-neu-surface dark:bg-darkNeu-surface text-neu-textMain dark:text-darkNeu-textMain shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner dark:active:shadow-neu-dark-inner',
    primary:
      'bg-neu-primary text-white shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner hover:opacity-90',
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
