import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Page introuvable</h1>
      <Link className="mt-6 text-sm font-medium text-teal-800 hover:underline" to="/">
        Retour à l'accueil
      </Link>
    </main>
  )
}