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
      className={`${sizeClass} rounded-full shadow-neu-drop dark:shadow-neu-dark-drop active:shadow-neu-inner text-neu-textMuted transition inline-flex justify-center items-center ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
