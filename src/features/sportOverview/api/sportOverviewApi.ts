import { supabase } from '../../../services/supabase/client'

export type OverviewFilters = { seasonId: string; disciplineId: string; seriesId: string }

type OverviewPlayer = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string
  active: boolean
}

export type OverviewRegistration = {
  id: string
  discipline: { name: string } | null
  series: { name: string } | null
  player: OverviewPlayer | null
}

export type OverviewTeam = {
  id: string
  status: 'ACTIVE' | 'INCOMPLETE' | 'ARCHIVED'
  playerOne: OverviewPlayer | null
  playerTwo: OverviewPlayer | null
}

function getClient() {
  if (!supabase) throw new Error('Le service Supabase n’est pas configuré.')
  return supabase
}

export async function listSportOverviewRegistrations(filters: OverviewFilters) {
  const { seasonId, disciplineId, seriesId } = filters
  if (!seasonId || !disciplineId || !seriesId) return []

  const { data, error } = await getClient()
    .from('player_disciplines')
    .select(
      'id, active, discipline:disciplines(name), series:series(name), player:profiles(id, first_name, last_name, phone, email, active)',
    )
    .eq('season_id', seasonId)
    .eq('discipline_id', disciplineId)
    .eq('series_id', seriesId)
    .eq('active', true)

  if (error) throw new Error(error.message)

  return (data as unknown as OverviewRegistration[]).filter((registration) => registration.player?.active)
}

export async function listSportOverviewTeams(filters: OverviewFilters) {
  const { seasonId, disciplineId, seriesId } = filters
  if (!seasonId || !disciplineId || !seriesId) return []

  const { data, error } = await getClient()
    .from('teams')
    .select(
      'id, status, team_members(active, start_date, player:profiles(id, first_name, last_name, phone, email, active))',
    )
    .eq('season_id', seasonId)
    .eq('discipline_id', disciplineId)
    .eq('series_id', seriesId)
    .order('start_date', { foreignTable: 'team_members', ascending: true })

  if (error) throw new Error(error.message)

  type Row = {
    id: string
    status: 'ACTIVE' | 'INCOMPLETE' | 'ARCHIVED'
    team_members: { active: boolean; player: OverviewPlayer | null }[]
  }

  return (data as unknown as Row[]).map((team) => {
    const activeMembers = team.team_members.filter((member) => member.active && member.player)
    return {
      id: team.id,
      status: team.status,
      playerOne: activeMembers[0]?.player ?? null,
      playerTwo: activeMembers[1]?.player ?? null,
    } satisfies OverviewTeam
  })
}
