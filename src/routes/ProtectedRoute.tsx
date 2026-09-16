import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function ProtectedRoute() {
  const { isLoading, session } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center text-sm text-stone-600">Chargement...</main>
  }

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/connexion" />
  }

  return <Outlet />
}