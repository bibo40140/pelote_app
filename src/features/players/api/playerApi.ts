import { supabase } from '../../../services/supabase/client'

export type Player = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role: 'PLAYER' | 'ADMIN'
  active: boolean
}

export type PlayerDiscipline = {
  id: string
  active: boolean
  season: { id: string; name: string } | null
  discipline: { id: string; name: string } | null
  series: { id: string; name: string } | null
}

export type PlayerInput = Pick<Player, 'first_name' | 'last_name' | 'email' | 'phone' | 'role'>
export type PlayerDisciplineInput = {
  player_id: string
  season_id: string
  discipline_id: string
  series_id: string
}

function getClient() {
  if (!supabase) throw new Error('Le service Supabase n’est pas configuré.')
  return supabase
}

export async function listPlayers() {
  const { data, error } = await getClient()
    .from('profiles')
    .select('id, first_name, last_name, email, phone, role, active')
    .order('last_name')
    .order('first_name')

  if (error) throw new Error(error.message)
  return data as Player[]
}

export async function getPlayer(playerId: string) {
  const { data, error } = await getClient()
    .from('profiles')
    .select('id, first_name, last_name, email, phone, role, active')
    .eq('id', playerId)
    .single()

  if (error) throw new Error(error.message)
  return data as Player
}

export async function createPlayer(input: PlayerInput) {
  const { error } = await getClient().from('profiles').insert({ ...input, phone: input.phone || null })
  if (error) throw new Error(error.message)
}

export async function updatePlayer(id: string, input: PlayerInput) {
  const { error } = await getClient().from('profiles').update({ ...input, phone: input.phone || null }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deactivatePlayer(id: string) {
  const { error } = await getClient()
    .from('profiles')
    .update({ active: false, deactivated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function listPlayerDisciplines(playerId: string) {
  const { data, error } = await getClient()
    .from('player_disciplines')
    .select('id, active, season:seasons(id, name), discipline:disciplines(id, name), series:series(id, name)')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as unknown as PlayerDiscipline[]
}

export async function createPlayerDiscipline(input: PlayerDisciplineInput) {
  const { error } = await getClient().from('player_disciplines').insert(input)
  if (error) throw new Error(error.message)
}

export async function archivePlayerDiscipline(id: string) {
  const { error } = await getClient()
    .from('player_disciplines')
    .update({ active: false, archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}