import { supabase } from '../../../services/supabase/client'

export const availabilityStatuses = ['UNAVAILABLE', 'AVAILABLE', 'PREFERRED'] as const

export type AvailabilityStatus = (typeof availabilityStatuses)[number]

export type AvailabilitySlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  period: { id: string; name: string } | null
  discipline: { id: string; name: string } | null
  installation: { id: string; name: string } | null
  availabilityStatus: AvailabilityStatus | null
}

function getClient() {
  if (!supabase) throw new Error('Le service Supabase n’est pas configuré.')
  return supabase
}

export async function listOwnAvailabilitySlots() {
  const client = getClient()
  const [slotsResult, availabilitiesResult] = await Promise.all([
    client
      .from('training_slots')
      .select(
        'id, day_of_week, start_time, end_time, period:training_periods!inner(id, name, status), discipline:disciplines(id, name), installation:installations(id, name)',
      )
      .eq('active', true)
      .eq('period.status', 'AVAILABILITIES_OPEN')
      .order('day_of_week')
      .order('start_time'),
    client.from('player_availabilities').select('training_slot_id, status'),
  ])

  if (slotsResult.error) throw new Error(slotsResult.error.message)
  if (availabilitiesResult.error) throw new Error(availabilitiesResult.error.message)

  const statuses = new Map(
    availabilitiesResult.data.map((availability) => [
      availability.training_slot_id as string,
      availability.status as AvailabilityStatus,
    ]),
  )

  type SlotRow = Omit<AvailabilitySlot, 'availabilityStatus'>
  return (slotsResult.data as unknown as SlotRow[]).map((slot) => ({
    ...slot,
    availabilityStatus: statuses.get(slot.id) ?? null,
  }))
}

export async function upsertOwnAvailability(trainingSlotId: string, status: AvailabilityStatus) {
  const { error } = await getClient().rpc('upsert_own_availability', {
    p_training_slot_id: trainingSlotId,
    p_status: status,
  })

  if (error) throw new Error(error.message)
}