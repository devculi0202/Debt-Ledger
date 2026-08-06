import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute({ session }) {
  if (session === undefined) {
    return (
      <div className="bg-neu-bg dark:bg-darkNeu-bg min-h-screen flex items-center justify-center text-neu-textMuted dark:text-darkNeu-textMuted">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
