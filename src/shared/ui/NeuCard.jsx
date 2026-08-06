export default function NeuCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-neu-surface dark:bg-darkNeu-surface rounded-neu-lg border border-line dark:border-line-dark shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
