import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="bg-neu-bg dark:bg-darkNeu-bg min-h-screen flex items-center justify-center p-6">
        <div className="bg-neu-surface dark:bg-darkNeu-surface rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop p-10 max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-neu-inner dark:shadow-neu-dark-inner text-brand-negative">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-neu-textMain dark:text-darkNeu-textMain">
            Something went wrong
          </h2>
          <p className="text-sm text-neu-textMuted">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-neu-primary text-white rounded-neu-md shadow-neu-drop dark:shadow-neu-dark-drop font-semibold hover:opacity-90 transition-all-custom"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
