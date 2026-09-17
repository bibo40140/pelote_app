import { supabase } from '../../../services/supabase/client'

type Reference = { id: string; name: string }

export type TrainingSlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
  period: Reference | null
  discipline: Reference | null
  installation: Reference | null
}

export type TrainingSlotInput = {
  training_period_id: string
  day_of_week: number
  start_time: string
  end_time: string
  discipline_id: string
  installation_id: string
}

export type TrainingSlotGridInput = {
  training_period_id: string
  discipline_id: string
  installation_id: string
  cells: { day_of_week: number; start_time: string; end_time: string }[]
}

export type TrainingSlotGridResult = { created: number; skipped: number }

function getClient() {
  if (!supabase) throw new Error('Le service Supabase n’est pas configuré.')
  return supabase
}

export async function listTrainingSlots() {
  const { data, error } = await getClient()
    .from('training_slots')
    .select(
      'id, day_of_week, start_time, end_time, active, period:training_periods(id, name), discipline:disciplines(id, name), installation:installations(id, name)',
    )
    .order('day_of_week')
    .order('start_time')

  if (error) throw new Error(error.message)
  return data as unknown as TrainingSlot[]
}

export async function createTrainingSlot(input: TrainingSlotInput) {
  const { error } = await getClient().from('training_slots').insert(input)
  if (error) throw new Error(error.message)
}

export async function createTrainingSlotsGrid(input: TrainingSlotGridInput): Promise<TrainingSlotGridResult> {
  const client = getClient()
  const { data: existing, error: existingError } = await client
    .from('training_slots')
    .select('day_of_week, start_time, end_time')
    .eq('training_period_id', input.training_period_id)
    .eq('discipline_id', input.discipline_id)
    .eq('installation_id', input.installation_id)

  if (existingError) throw new Error(existingError.message)

  const existingKeys = new Set(
    existing.map((slot) => `${slot.day_of_week}-${String(slot.start_time).slice(0, 5)}-${String(slot.end_time).slice(0, 5)}`),
  )
  const cellsToCreate = input.cells.filter(
    (cell) => !existingKeys.has(`${cell.day_of_week}-${cell.start_time}-${cell.end_time}`),
  )

  if (cellsToCreate.length > 0) {
    const { error } = await client.from('training_slots').insert(
      cellsToCreate.map((cell) => ({
        ...cell,
        training_period_id: input.training_period_id,
        discipline_id: input.discipline_id,
        installation_id: input.installation_id,
      })),
    )
    if (error) throw new Error(error.message)
  }

  return { created: cellsToCreate.length, skipped: input.cells.length - cellsToCreate.length }
}

export async function updateTrainingSlot(id: string, input: TrainingSlotInput) {
  const { error } = await getClient().from('training_slots').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function archiveTrainingSlot(id: string) {
  const { error } = await getClient()
    .from('training_slots')
    .update({ active: false, archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}