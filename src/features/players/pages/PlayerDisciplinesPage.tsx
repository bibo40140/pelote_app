import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { AdminNav } from '../../admin/components/AdminNav'
import { useReferences } from '../../admin/hooks/useReferences'
import type { NamedReference, Season, Series } from '../../admin/api/referenceApi'
import { usePlayer, usePlayerDisciplines } from '../hooks/usePlayers'

type RegistrationForm = { season_id: string; discipline_id: string; series_id: string }

export function PlayerDisciplinesPage() {
  const { playerId } = useParams()
  const player = usePlayer(playerId)
  const registrations = usePlayerDisciplines(playerId ?? null)
  const seasons = useReferences<Season>('seasons', 'id, name, start_date, end_date, active')
  const disciplines = useReferences<NamedReference>('disciplines', 'id, name, description, active')
  const series = useReferences<Series>('series', 'id, name, sort_order, active')
  const form = useForm<RegistrationForm>({ defaultValues: { season_id: '', discipline_id: '', series_id: '' } })

  async function addRegistration(values: RegistrationForm) {
    if (!playerId) return
    await registrations.create.mutateAsync({ player_id: playerId, ...values })
    form.reset()
  }

  const requestError = player.error || registrations.error || registrations.create.error || registrations.archive.error || seasons.error || disciplines.error || series.error

  if (player.isLoading) return <p className="text-sm text-stone-600">Chargement du joueur...</p>
  if (player.error || !player.data) return <p className="text-sm text-red-700" role="alert">{player.error?.message ?? 'Joueur introuvable.'}</p>

  return (
    <section>
      <AdminNav />
      <Link className="text-sm font-medium text-teal-800 hover:underline" to="/admin/players">Retour aux joueurs</Link>
      <h1 className="mt-4 text-3xl font-semibold">Disciplines de {player.data.first_name} {player.data.last_name}</h1>
      <p className="mt-2 text-stone-600">{player.data.email}</p>

      <form className="mt-8 grid gap-3 sm:grid-cols-3" onSubmit={form.handleSubmit(addRegistration)}>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...form.register('season_id', { required: true })}><option value="">Saison</option>{seasons.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...form.register('discipline_id', { required: true })}><option value="">Discipline</option>{disciplines.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...form.register('series_id', { required: true })}><option value="">Série</option>{series.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white sm:col-span-3" disabled={registrations.create.isPending} type="submit">Ajouter l’inscription</button>
      </form>

      {requestError ? <p className="mt-4 text-sm text-red-700" role="alert">{requestError.message}</p> : null}
      {registrations.create.isSuccess || registrations.archive.isSuccess ? <p className="mt-4 text-sm text-teal-800" role="status">Inscriptions mises à jour.</p> : null}
      {registrations.isLoading ? <p className="mt-6 text-sm text-stone-600">Chargement des inscriptions...</p> : <table className="mt-6 w-full text-left text-sm"><thead><tr className="border-b border-stone-300"><th className="py-2">Saison</th><th>Discipline</th><th>Série</th><th>Statut</th><th /></tr></thead><tbody>{registrations.data?.map((item) => <tr className="border-b border-stone-200" key={item.id}><td className="py-3">{item.season?.name ?? 'Saison'}</td><td>{item.discipline?.name ?? 'Discipline'}</td><td>{item.series?.name ?? 'Série'}</td><td>{item.active ? 'Active' : 'Inactive'}</td><td>{item.active ? <button className="text-red-700" onClick={() => registrations.archive.mutate(item.id)} type="button">Désactiver</button> : null}</td></tr>)}</tbody></table>}
    </section>
  )
}