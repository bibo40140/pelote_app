import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function AppLayout() {
  const { signOut, user } = useAuth()

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link className="text-lg font-semibold tracking-wide text-teal-800" to="/">
            PELOTE_APP
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-stone-600 sm:block">{user?.email}</span>
            <Link className="text-sm font-medium text-stone-600 hover:text-teal-800" to="/profil">
              Profil
            </Link>
            <Link className="text-sm font-medium text-stone-600 hover:text-teal-800" to="/admin/seasons">
              Administration
            </Link>
            <button className="text-sm font-medium text-stone-600 hover:text-teal-800" onClick={handleSignOut} type="button">
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <Outlet />
      </main>
    </div>
  )
}