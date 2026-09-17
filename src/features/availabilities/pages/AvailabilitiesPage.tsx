import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import type { AvailabilitySlot, AvailabilityStatus } from '../api/availabilityApi'
import { useAvailabilities } from '../hooks/useAvailabilities'

const nextStatus: Record<AvailabilityStatus, AvailabilityStatus> = {
  AVAILABLE: 'PREFERRED',
  PREFERRED: 'UNAVAILABLE',
  UNAVAILABLE: 'AVAILABLE',
}

export function AvailabilitiesPage() {
  const availabilities = useAvailabilities()
  const [periodId, setPeriodId] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [localStatuses, setLocalStatuses] = useState<Record<string, AvailabilityStatus>>({})

  useEffect(() => {
    if (!availabilities.data) return
    setLocalStatuses(Object.fromEntries(availabilities.data.flatMap((slot) => slot.availabilityStatus ? [[slot.id, slot.availabilityStatus]] : [])))
    const periodIds = [...new Set(availabilities.data.map((slot) => slot.period?.id).filter(Boolean))]
    if (!periodId || !periodIds.includes(periodId)) setPeriodId(periodIds[0] ?? '')
  }, [availabilities.data, periodId])

  const periods = [...new Map(availabilities.data?.flatMap((slot) => slot.period ? [[slot.period.id, slot.period] as const] : []) ?? []).values()]
  const periodSlots = availabilities.data?.filter((slot) => slot.period?.id === periodId) ?? []
  const disciplines = [...new Map(periodSlots.flatMap((slot) => slot.discipline ? [[slot.discipline.id, slot.discipline] as const] : [])).values()]

  useEffect(() => {
    if (!disciplineId || !disciplines.some((discipline) => discipline.id === disciplineId)) setDisciplineId(disciplines[0]?.id ?? '')
  }, [disciplineId, disciplines])

  const visibleSlots = periodSlots
    .filter((slot) => slot.discipline?.id === disciplineId)
    .map((slot) => ({ ...slot, availabilityStatus: localStatuses[slot.id] ?? null }))

  function cycle(slot: AvailabilitySlot) {
    const status = slot.availabilityStatus ? nextStatus[slot.availabilityStatus] : 'AVAILABLE'
    setLocalStatuses((current) => ({ ...current, [slot.id]: status }))
    availabilities.save.mutate({ trainingSlotId: slot.id, status })
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold">Mes disponibilités</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">Cliquez sur chaque créneau pour indiquer successivement : disponible, préféré ou indisponible.</p>
      <Link className="mt-5 inline-block border border-teal-800 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50" to="/exceptions">Gérer mes exceptions</Link>

      {availabilities.error ? <p className="mt-4 text-sm text-red-700" role="alert">{availabilities.error.message}</p> : null}
      {availabilities.save.error ? <p className="mt-4 text-sm text-red-700" role="alert">{availabilities.save.error.message}</p> : null}

      {availabilities.isLoading ? (
        <p className="mt-6 text-sm text-stone-600">Chargement...</p>
      ) : availabilities.data?.length === 0 ? (
        <p className="mt-6 text-sm text-stone-600">Aucun créneau n’est actuellement ouvert aux réponses.</p>
      ) : (
        <div className="mt-6">
          <label className="grid max-w-sm gap-1 text-sm font-medium text-stone-700">
            Période
            <select className="border border-stone-300 bg-white px-3 py-2 font-normal" onChange={(event) => setPeriodId(event.target.value)} value={periodId}>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </label>

          <div className="mt-6 flex flex-wrap gap-2 border-b border-stone-300" role="tablist" aria-label="Disciplines">
            {disciplines.map((discipline) => (
              <button
                aria-selected={discipline.id === disciplineId}
                className={`border border-b-0 px-4 py-2 text-sm font-semibold ${discipline.id === disciplineId ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-white text-stone-700'}`}
                key={discipline.id}
                onClick={() => setDisciplineId(discipline.id)}
                role="tab"
                type="button"
              >
                {discipline.name}
              </button>
            ))}
          </div>

          {visibleSlots.length > 0 ? (
            <AvailabilityGrid
              onCycle={cycle}
              savedSlotId={availabilities.save.isSuccess ? availabilities.save.variables?.trainingSlotId ?? null : null}
              savingSlotId={availabilities.save.isPending ? availabilities.save.variables?.trainingSlotId ?? null : null}
              slots={visibleSlots}
            />
          ) : <p className="mt-6 text-sm text-stone-600">Aucun créneau pour cette discipline.</p>}
        </div>
      )}
    </section>
  )
}