import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function LoginPage() {
  const { isLoading, session, signIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center text-sm text-stone-600">Chargement...</main>
  }

  if (session) {
    return <Navigate replace to="/" />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const signInError = await signIn(email, password)

    setIsSubmitting(false)

    if (signInError) {
      setError(signInError)
      return
    }

    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
    navigate(from, { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">PELOTE_APP</p>
      <h1 className="mt-2 text-3xl font-semibold">Connexion</h1>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-stone-700">
          Adresse e-mail
          <input
            autoComplete="email"
            className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-700"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Mot de passe
          <input
            autoComplete="current-password"
            className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-700"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
        <button
          className="w-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}