import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function AdminRoute() {
  const { isLoading, role } = useAuth()

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center text-sm text-stone-600">Chargement...</main>
  }

  if (role !== 'ADMIN') {
    return <Navigate replace to="/" />
  }

  return <Outlet />
}