import { supabase } from '../../../services/supabase/client'

type Reference = { id: string; name: string }

export const trainingPeriodStatuses = [
  'PREPARATION',
  'AVAILABILITIES_OPEN',
  'PLANNING_IN_PROGRESS',
  'PUBLISHED',
  'COMPLETED',
  'CANCELLED',
] as const

export type TrainingPeriodStatus = (typeof trainingPeriodStatuses)[number]

export type TrainingPeriod = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: TrainingPeriodStatus
  season: Reference | null
}

export type TrainingPeriodInput = {
  name: string
  season_id: string
  start_date: string
  end_date: string
}

function getClient() {
  if (!supabase) throw new Error('Le service Supabase n’est pas configuré.')
  return supabase
}

async function getCurrentProfileId() {
  const client = getClient()
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError || !authData.user) throw new Error('Utilisateur non authentifié.')

  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

export async function listTrainingPeriods() {
  const { data, error } = await getClient()
    .from('training_periods')
    .select('id, name, start_date, end_date, status, season:seasons(id, name)')
    .order('start_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data as unknown as TrainingPeriod[]
}

export async function createTrainingPeriod(input: TrainingPeriodInput) {
  const createdBy = await getCurrentProfileId()
  const { error } = await getClient().from('training_periods').insert({
    ...input,
    status: 'PREPARATION',
    created_by: createdBy,
  })

  if (error) throw new Error(error.message)
}

export async function updateTrainingPeriod(id: string, input: TrainingPeriodInput) {
  const { error } = await getClient().from('training_periods').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function changeTrainingPeriodStatus(id: string, status: TrainingPeriodStatus) {
  const { error } = await getClient()
    .from('training_periods')
    .update({
      status,
      cancelled_at: status === 'CANCELLED' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function archiveTrainingPeriod(id: string) {
  await changeTrainingPeriodStatus(id, 'CANCELLED')
}