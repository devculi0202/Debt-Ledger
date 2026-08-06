export default function NeuCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-neu-surface dark:bg-darkNeu-surface rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
