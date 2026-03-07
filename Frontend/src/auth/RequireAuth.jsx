import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] grid place-items-center">
        <p className="text-textColor font-[700]">Loading…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}

export default RequireAuth
