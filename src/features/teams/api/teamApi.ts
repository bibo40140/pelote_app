import { supabase } from '../../../services/supabase/client'

type Reference = { id: string; name: string }

export type Team = {
  id: string
  status: 'ACTIVE' | 'INCOMPLETE' | 'ARCHIVED'
  season: Reference | null
  discipline: Reference | null
  series: Reference | null
}

export type TeamMember = {
  id: string
  active: boolean
  player: { id: string; first_name: string; last_name: string } | null
}

export type EligiblePlayer = {
  id: string
  first_name: string
  last_name: string
}

export type CreateTeamInput = {
  seasonId: string
  disciplineId: string
  seriesId: string
  playerIds: [string, string]
}

function getClient() {
  if (!supabase) throw new Error('Le service Supabase n’est pas configuré.')
  return supabase
}

async function getCurrentProfileId() {
  const { data: authData, error: authError } = await getClient().auth.getUser()
  if (authError || !authData.user) throw new Error('Utilisateur non authentifié.')

  const { data, error } = await getClient().from('profiles').select('id').eq('auth_user_id', authData.user.id).single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function listTeams() {
  const { data, error } = await getClient()
    .from('teams')
    .select('id, status, season:seasons(id, name), discipline:disciplines(id, name), series:series(id, name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as unknown as Team[]
}

export async function listTeamMembers(teamId: string) {
  const { data, error } = await getClient()
    .from('team_members')
    .select('id, active, player:profiles(id, first_name, last_name)')
    .eq('team_id', teamId)
    .order('start_date')

  if (error) throw new Error(error.message)
  return data as unknown as TeamMember[]
}

// Players already active in another ACTIVE team for this season/discipline cannot be reused,
// regardless of that other team's series.
async function listPlayerIdsInActiveTeams(seasonId: string, disciplineId: string) {
  const { data: activeTeams, error: teamsError } = await getClient()
    .from('teams')
    .select('id')
    .eq('season_id', seasonId)
    .eq('discipline_id', disciplineId)
    .eq('status', 'ACTIVE')

  if (teamsError) throw new Error(teamsError.message)
  if (activeTeams.length === 0) return new Set<string>()

  const { data: members, error: membersError } = await getClient()
    .from('team_members')
    .select('player_id')
    .eq('active', true)
    .in(
      'team_id',
      activeTeams.map((team) => team.id),
    )

  if (membersError) throw new Error(membersError.message)
  return new Set(members.map((member) => member.player_id as string))
}

export async function listEligiblePlayers(seasonId: string, disciplineId: string, seriesId: string) {
  if (!seasonId || !disciplineId || !seriesId) return []

  const { data, error } = await getClient()
    .from('player_disciplines')
    .select('player:profiles(id, first_name, last_name, active)')
    .eq('season_id', seasonId)
    .eq('discipline_id', disciplineId)
    .eq('series_id', seriesId)
    .eq('active', true)

  if (error) throw new Error(error.message)

  const alreadyEngagedPlayerIds = await listPlayerIdsInActiveTeams(seasonId, disciplineId)

  const players = data
    .map((registration) => registration.player as unknown as (EligiblePlayer & { active: boolean }) | null)
    .filter((player): player is EligiblePlayer & { active: boolean } => Boolean(player?.active))
    .filter((player) => !alreadyEngagedPlayerIds.has(player.id))

  return [...new Map(players.map((player) => [player.id, player])).values()]
}

async function isPlayerEligible(seasonId: string, disciplineId: string, seriesId: string, playerId: string) {
  const eligiblePlayers = await listEligiblePlayers(seasonId, disciplineId, seriesId)
  return eligiblePlayers.some((player) => player.id === playerId)
}

export async function createTeam(input: CreateTeamInput) {
  const [playerOneId, playerTwoId] = input.playerIds

  if (!playerOneId || !playerTwoId) throw new Error('Les deux joueurs sont requis.')
  if (playerOneId === playerTwoId) throw new Error('Les deux joueurs doivent être différents.')

  // Re-check eligibility right before insert to protect against stale client state.
  const [playerOneEligible, playerTwoEligible] = await Promise.all([
    isPlayerEligible(input.seasonId, input.disciplineId, input.seriesId, playerOneId),
    isPlayerEligible(input.seasonId, input.disciplineId, input.seriesId, playerTwoId),
  ])

  if (!playerOneEligible || !playerTwoEligible) {
    throw new Error('Un des joueurs sélectionnés n’est plus éligible pour cette combinaison.')
  }

  const client = getClient()
  const createdBy = await getCurrentProfileId()
  const { data: team, error: teamError } = await client
    .from('teams')
    .insert({
      season_id: input.seasonId,
      discipline_id: input.disciplineId,
      series_id: input.seriesId,
      status: 'ACTIVE',
      created_by: createdBy,
    })
    .select('id')
    .single()

  if (teamError) throw new Error(teamError.message)

  // TODO: the team row and its two members are created with separate statements because no
  // transactional RPC exists yet. Prefer a SQL function that inserts both atomically.
  const { error: membersError } = await client.from('team_members').insert(
    input.playerIds.map((playerId) => ({
      team_id: team.id,
      player_id: playerId,
      start_date: new Date().toISOString().slice(0, 10),
      active: true,
    })),
  )

  if (membersError) {
    // No transactional RPC and no DELETE grant exist for `teams`, so a failed member insert
    // cannot be rolled back by deleting the row. Archive it instead so it never lingers as an
    // ACTIVE team without its two members; a transactional RPC should replace this later.
    await client.from('teams').update({ status: 'ARCHIVED', archived_at: new Date().toISOString() }).eq('id', team.id)
    throw new Error(membersError.message)
  }
}

export async function archiveTeam(id: string) {
  const { error } = await getClient()
    .from('teams')
    .update({ status: 'ARCHIVED', archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}