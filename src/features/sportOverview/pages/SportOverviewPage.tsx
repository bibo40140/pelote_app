import { useForm } from 'react-hook-form'
import { AdminNav } from '../../admin/components/AdminNav'
import type { NamedReference, Season, Series } from '../../admin/api/referenceApi'
import { useReferences } from '../../admin/hooks/useReferences'
import { useSportOverviewRegistrations, useSportOverviewTeams } from '../hooks/useSportOverview'

type FiltersForm = { seasonId: string; disciplineId: string; seriesId: string }

export function SportOverviewPage() {
  const { register, watch } = useForm<FiltersForm>({ defaultValues: { seasonId: '', disciplineId: '', seriesId: '' } })
  const seasonId = watch('seasonId')
  const disciplineId = watch('disciplineId')
  const seriesId = watch('seriesId')
  const filters = { seasonId, disciplineId, seriesId }

  const seasons = useReferences<Season>('seasons', 'id, name, start_date, end_date, active')
  const disciplines = useReferences<NamedReference>('disciplines', 'id, name, description, active')
  const series = useReferences<Series>('series', 'id, name, sort_order, active')

  const registrations = useSportOverviewRegistrations(filters)
  const teams = useSportOverviewTeams(filters)

  const criteriaSelected = Boolean(seasonId && disciplineId && seriesId)
  const requestError = registrations.error || teams.error || seasons.error || disciplines.error || series.error

  return (
    <section>
      <AdminNav />
      <h1 className="text-3xl font-semibold">Vue récapitulative sportive</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">Consultation en lecture seule des effectifs et des équipes pour une saison, une discipline et une série données.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <select className="border border-stone-300 bg-white px-3 py-2" {...register('seasonId')}>
          <option value="">Saison</option>
          {seasons.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="border border-stone-300 bg-white px-3 py-2" {...register('disciplineId')}>
          <option value="">Discipline</option>
          {disciplines.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="border border-stone-300 bg-white px-3 py-2" {...register('seriesId')}>
          <option value="">Série</option>
          {series.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {!criteriaSelected ? <p className="mt-4 text-sm text-stone-600">Sélectionnez la saison, la discipline et la série pour afficher les effectifs.</p> : null}
      {requestError ? <p className="mt-4 text-sm text-red-700" role="alert">{requestError.message}</p> : null}

      {criteriaSelected ? (
        <div className="mt-6 flex gap-6 text-sm text-stone-700">
          <p><span className="font-semibold">{registrations.data?.length ?? 0}</span> joueur(s)</p>
          <p><span className="font-semibold">{teams.data?.length ?? 0}</span> équipe(s)</p>
        </div>
      ) : null}

      {criteriaSelected ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Joueurs</h2>
            {registrations.isLoading ? (
              <p className="mt-3 text-sm text-stone-600">Chargement...</p>
            ) : registrations.data?.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">Aucun joueur inscrit pour ces critères.</p>
            ) : (
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-300">
                    <th className="py-2">Prénom</th>
                    <th>Nom</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Discipline</th>
                    <th>Série</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.data?.map((registration) => (
                    <tr className="border-b border-stone-200" key={registration.id}>
                      <td className="py-3">{registration.player?.first_name}</td>
                      <td>{registration.player?.last_name}</td>
                      <td>{registration.player?.phone ?? '—'}</td>
                      <td>{registration.player?.email}</td>
                      <td>{registration.discipline?.name}</td>
                      <td>{registration.series?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold">Équipes</h2>
            {teams.isLoading ? (
              <p className="mt-3 text-sm text-stone-600">Chargement...</p>
            ) : teams.data?.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">Aucune équipe pour ces critères.</p>
            ) : (
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-300">
                    <th className="py-2">Équipe</th>
                    <th>Joueur 1</th>
                    <th>Joueur 2</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.data?.map((team, index) => (
                    <tr className="border-b border-stone-200" key={team.id}>
                      <td className="py-3">Équipe {index + 1}</td>
                      <td>{team.playerOne ? `${team.playerOne.first_name} ${team.playerOne.last_name}` : '—'}</td>
                      <td>{team.playerTwo ? `${team.playerTwo.first_name} ${team.playerTwo.last_name}` : '—'}</td>
                      <td>{team.playerOne?.phone ?? team.playerTwo?.phone ?? '—'}</td>
                      <td>{team.playerOne?.email ?? team.playerTwo?.email ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
