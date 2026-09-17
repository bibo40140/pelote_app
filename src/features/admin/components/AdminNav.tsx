import { NavLink } from 'react-router-dom'

const links = [
  ['Joueurs', '/admin/players'],
  ['Équipes', '/admin/teams'],
  ['Vue sportive', '/admin/sport-overview'],
  ['Saisons', '/admin/seasons'],
  ['Disciplines', '/admin/disciplines'],
  ['Séries', '/admin/series'],
  ['Types d’installation', '/admin/installation-types'],
  ['Installations', '/admin/installations'],
]

export function AdminNav() {
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Référentiels">
      {links.map(([label, to]) => (
        <NavLink
          className={({ isActive }) => `border px-3 py-2 text-sm ${isActive ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-white text-stone-700'}`}
          key={to}
          to={to}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}