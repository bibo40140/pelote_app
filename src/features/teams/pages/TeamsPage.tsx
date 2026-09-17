import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AdminNav } from '../../admin/components/AdminNav'
import type { NamedReference, Season, Series } from '../../admin/api/referenceApi'
import { useReferences } from '../../admin/hooks/useReferences'
import type { Team } from '../api/teamApi'
import { useEligiblePlayers, useTeamMembers, useTeams } from '../hooks/useTeams'

type TeamForm = { seasonId: string; disciplineId: string; seriesId: string; playerOneId: string; playerTwoId: string }

export function TeamsPage() {
  const teams = useTeams()
  const { register, handleSubmit, watch, reset, setValue } = useForm<TeamForm>({ defaultValues: { seasonId: '', disciplineId: '', seriesId: '', playerOneId: '', playerTwoId: '' } })
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const members = useTeamMembers(selectedTeam?.id ?? null)
  const seasonId = watch('seasonId')
  const disciplineId = watch('disciplineId')
  const seriesId = watch('seriesId')
  const playerOneId = watch('playerOneId')
  const playerTwoId = watch('playerTwoId')
  const eligiblePlayers = useEligiblePlayers(seasonId, disciplineId, seriesId)
  const seasons = useReferences<Season>('seasons', 'id, name, start_date, end_date, active')
  const disciplines = useReferences<NamedReference>('disciplines', 'id, name, description, active')
  const series = useReferences<Series>('series', 'id, name, sort_order, active')
  const criteriaSelected = Boolean(seasonId && disciplineId && seriesId)
  const playersSelectedAndDistinct = Boolean(playerOneId && playerTwoId && playerOneId !== playerTwoId)

  // Changing any of the three criteria invalidates the previous player selection.
  useEffect(() => {
    setValue('playerOneId', '')
    setValue('playerTwoId', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, disciplineId, seriesId])

  async function submit(values: TeamForm) {
    if (!values.playerOneId || !values.playerTwoId || values.playerOneId === values.playerTwoId) return
    await teams.create.mutateAsync({
      seasonId: values.seasonId,
      disciplineId: values.disciplineId,
      seriesId: values.seriesId,
      playerIds: [values.playerOneId, values.playerTwoId],
    })
    reset()
  }

  const requestError = teams.error || teams.create.error || teams.archive.error || eligiblePlayers.error || members.error || seasons.error || disciplines.error || series.error

  return (
    <section>
      <AdminNav />
      <h1 className="text-3xl font-semibold">Équipes</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">Une équipe conserve son partenariat historique. Pour changer de joueurs, archivez l’équipe puis créez-en une nouvelle.</p>

      <form className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleSubmit(submit)}>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('seasonId', { required: true })}><option value="">Saison</option>{seasons.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('disciplineId', { required: true })}><option value="">Discipline</option>{disciplines.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('seriesId', { required: true })}><option value="">Série</option>{series.data?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select className="border border-stone-300 bg-white px-3 py-2" disabled={!criteriaSelected} required {...register('playerOneId', { required: true })}>
          <option value="">Premier joueur</option>
          {eligiblePlayers.data?.filter((player) => player.id !== playerTwoId).map((player) => <option key={player.id} value={player.id}>{player.first_name} {player.last_name}</option>)}
        </select>
        <select className="border border-stone-300 bg-white px-3 py-2" disabled={!criteriaSelected} required {...register('playerTwoId', { required: true })}>
          <option value="">Second joueur</option>
          {eligiblePlayers.data?.filter((player) => player.id !== playerOneId).map((player) => <option key={player.id} value={player.id}>{player.first_name} {player.last_name}</option>)}
        </select>
        <button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={!criteriaSelected || !playersSelectedAndDistinct || teams.create.isPending} type="submit">Créer l’équipe</button>
      </form>
      {!criteriaSelected ? <p className="mt-3 text-sm text-stone-600">Sélectionnez d’abord la saison, la discipline et la série.</p> : null}
      {criteriaSelected && !eligiblePlayers.isLoading && eligiblePlayers.data?.length === 0 ? <p className="mt-3 text-sm text-stone-600">Aucun joueur disponible pour cette saison, cette discipline et cette série.</p> : null}
      {playerOneId && playerOneId === playerTwoId ? <p className="mt-3 text-sm text-red-700" role="alert">Les deux joueurs doivent être différents.</p> : null}
      {requestError ? <p className="mt-3 text-sm text-red-700" role="alert">{requestError.message}</p> : null}
      {teams.create.isSuccess || teams.archive.isSuccess ? <p className="mt-3 text-sm text-teal-800" role="status">Équipe enregistrée.</p> : null}


      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div>{teams.isLoading ? <p className="text-sm text-stone-600">Chargement...</p> : <table className="w-full text-left text-sm"><thead><tr className="border-b border-stone-300"><th className="py-2">Discipline</th><th>Saison</th><th>Série</th><th>Statut</th><th /></tr></thead><tbody>{teams.data?.map((team) => <tr className="border-b border-stone-200" key={team.id}><td className="py-3"><button className="font-medium text-teal-800" onClick={() => setSelectedTeam(team)} type="button">{team.discipline?.name ?? 'Discipline'}</button></td><td>{team.season?.name ?? 'Saison'}</td><td>{team.series?.name ?? 'Série'}</td><td>{team.status}</td><td>{team.status !== 'ARCHIVED' ? <button className="text-red-700" onClick={() => teams.archive.mutate(team.id)} type="button">Archiver</button> : null}</td></tr>)}</tbody></table>}</div>
        <aside className="border-l border-stone-200 pl-0 lg:pl-8"><h2 className="text-xl font-semibold">Membres</h2>{selectedTeam ? <><p className="mt-2 text-sm text-stone-600">{selectedTeam.discipline?.name} / {selectedTeam.season?.name}</p>{members.isLoading ? <p className="mt-4 text-sm text-stone-600">Chargement...</p> : <ul className="mt-4 divide-y divide-stone-200">{members.data?.map((member) => <li className="py-3 text-sm" key={member.id}>{member.player?.first_name} {member.player?.last_name} {!member.active ? '(ancien membre)' : ''}</li>)}</ul>}</> : <p className="mt-3 text-sm text-stone-600">Sélectionnez une équipe pour consulter ses membres.</p>}</aside>
      </div>
    </section>
  )
}