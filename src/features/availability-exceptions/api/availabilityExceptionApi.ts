import { supabase } from '../../../services/supabase/client'

export const exceptionTypes = ['AVAILABLE_EXCEPTION', 'UNAVAILABLE_EXCEPTION'] as const

export type AvailabilityExceptionType = (typeof exceptionTypes)[number]
export type RecurringAvailabilityStatus = 'UNAVAILABLE' | 'AVAILABLE' | 'PREFERRED'

export type AvailabilityException = {
  id: string
  exception_type: AvailabilityExceptionType
  start_date: string
  end_date: string
  reason: string | null
  active: boolean
  slot: ExceptionSlot | null
}

export type ExceptionSlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  period: { id: string; name: string; start_date: string; end_date: string; season_id: string; status: string } | null
  discipline: { id: string; name: string } | null
  installation: { id: string; name: string } | null
  recurringStatus: RecurringAvailabilityStatus | null
}

export type OneOffExceptionInput = {
  training_slot_id: string
  exception_date: string
  exception_type: AvailabilityExceptionType
  reason: string
}

export type UnavailabilityPeriodInput = { start_date: string; end_date: string; reason: string }

function getClient() {
  if (!supabase) throw new Error('Le service Supabase n’est pas configuré.')
  return supabase
}

export async function listOwnAvailabilityExceptions() {
  const client = getClient()
  const [exceptionsResult, slotsResult, registrationsResult, availabilitiesResult] = await Promise.all([
    client.from('availability_exceptions').select('id, exception_type, start_date, end_date, reason, active, slot:training_slots(id, day_of_week, start_time, end_time, period:training_periods(id, name, start_date, end_date, season_id), discipline:disciplines(id, name), installation:installations(id, name))').eq('active', true).order('start_date', { ascending: false }),
    client.from('training_slots').select('id, day_of_week, start_time, end_time, period:training_periods!inner(id, name, start_date, end_date, season_id, status), discipline:disciplines(id, name), installation:installations(id, name)').eq('active', true).eq('period.status', 'AVAILABILITIES_OPEN').order('day_of_week').order('start_time'),
    client.from('player_disciplines').select('season_id, discipline_id').eq('active', true),
    client.from('player_availabilities').select('training_slot_id, status'),
  ])

  if (exceptionsResult.error) throw new Error(exceptionsResult.error.message)
  if (slotsResult.error) throw new Error(slotsResult.error.message)
  if (registrationsResult.error) throw new Error(registrationsResult.error.message)
  if (availabilitiesResult.error) throw new Error(availabilitiesResult.error.message)

  const registrations = new Set(registrationsResult.data.map((item) => `${item.season_id}-${item.discipline_id}`))
  const recurringStatuses = new Map(
    availabilitiesResult.data.map((item) => [item.training_slot_id as string, item.status as RecurringAvailabilityStatus]),
  )
  type SlotRow = Omit<ExceptionSlot, 'recurringStatus'>
  const slots = (slotsResult.data as unknown as SlotRow[])
    .filter((slot) => slot.period && slot.discipline && registrations.has(`${slot.period.season_id}-${slot.discipline.id}`))
    .map((slot) => ({ ...slot, recurringStatus: recurringStatuses.get(slot.id) ?? null }))
  return { exceptions: exceptionsResult.data as unknown as AvailabilityException[], slots }
}

export async function upsertOwnAvailabilityException(input: OneOffExceptionInput) {
  const { error } = await getClient().rpc('upsert_own_availability_exception', {
    p_training_slot_id: input.training_slot_id,
    p_exception_date: input.exception_date,
    p_exception_type: input.exception_type,
    p_reason: input.reason,
  })

  if (error) throw new Error(error.message)
}

export async function createOwnUnavailabilityPeriod(input: UnavailabilityPeriodInput) {
  const { error } = await getClient().rpc('create_own_unavailability_period', { p_start_date: input.start_date, p_end_date: input.end_date, p_reason: input.reason })
  if (error) throw new Error(error.message)
}

export async function cancelOwnAvailabilityException(id: string) {
  const { error } = await getClient().rpc('cancel_own_availability_exception', { p_exception_id: id })
  if (error) throw new Error(error.message)
}

export async function upsertOwnAvailabilityExceptions(inputs: OneOffExceptionInput[]) {
  const results = await Promise.allSettled(inputs.map(upsertOwnAvailabilityException))
  return {
    saved: results.filter((result) => result.status === 'fulfilled').length,
    errors: results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [{ input: inputs[index], message: result.reason instanceof Error ? result.reason.message : 'Erreur inconnue' }]
        : [],
    ),
  }
}