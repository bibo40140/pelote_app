import type { AvailabilitySlot, AvailabilityStatus } from '../api/availabilityApi'

const days = [
  [1, 'Lundi'],
  [2, 'Mardi'],
  [3, 'Mercredi'],
  [4, 'Jeudi'],
  [5, 'Vendredi'],
  [6, 'Samedi'],
  [7, 'Dimanche'],
] as const

const statusLabels: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Disponible',
  PREFERRED: 'Préféré',
  UNAVAILABLE: 'Indisponible',
}

const statusClasses: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  PREFERRED: 'border-teal-700 bg-teal-700 text-white',
  UNAVAILABLE: 'border-red-400 bg-red-50 text-red-900',
}

type Props = {
  slots: AvailabilitySlot[]
  savingSlotId: string | null
  savedSlotId: string | null
  onCycle: (slot: AvailabilitySlot) => void
}

export function AvailabilityGrid({ slots, savingSlotId, savedSlotId, onCycle }: Props) {
  const timeRanges = [...new Set(slots.map((slot) => `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`))]
    .sort((left, right) => left.localeCompare(right))

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600" aria-label="Légende des disponibilités">
        <span className="flex items-center gap-2"><span className="size-3 border border-stone-300 bg-white" />Sans réponse</span>
        <span className="flex items-center gap-2"><span className="size-3 border border-emerald-500 bg-emerald-50" />Disponible</span>
        <span className="flex items-center gap-2"><span className="size-3 bg-teal-700" />Préféré</span>
        <span className="flex items-center gap-2"><span className="size-3 border border-red-400 bg-red-50" />Indisponible</span>
      </div>

      <div className="mt-3 overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-6xl table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 border-b border-r border-stone-300 bg-stone-100 px-3 py-4 text-left font-semibold" scope="col">Horaire</th>
              {days.map(([, label]) => <th className="border-b border-r border-stone-300 bg-stone-100 px-2 py-4 text-center font-semibold last:border-r-0" key={label} scope="col">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {timeRanges.map((timeRange) => {
              const [startTime, endTime] = timeRange.split('-')
              return (
                <tr key={timeRange}>
                  <th className="border-b border-r border-stone-300 bg-stone-50 px-3 py-5 text-left font-semibold whitespace-nowrap" scope="row">{startTime}-{endTime}</th>
                  {days.map(([day]) => {
                    const cellSlots = slots.filter((slot) => slot.day_of_week === day && slot.start_time.slice(0, 5) === startTime && slot.end_time.slice(0, 5) === endTime)
                    return (
                      <td className="h-24 border-b border-r border-stone-300 p-2 align-top last:border-r-0" key={day}>
                        <div className="grid h-full gap-2">
                          {cellSlots.map((slot) => {
                            const status = slot.availabilityStatus
                            return (
                              <button
                                aria-label={`${slot.installation?.name ?? 'Installation'}, ${status ? statusLabels[status] : 'sans réponse'}`}
                                className={`min-h-18 border-2 px-2 py-3 text-center transition-colors disabled:opacity-60 ${status ? statusClasses[status] : 'border-dashed border-stone-300 bg-white text-stone-700 hover:border-emerald-400 hover:bg-emerald-50'}`}
                                disabled={savingSlotId === slot.id}
                                key={slot.id}
                                onClick={() => onCycle(slot)}
                                type="button"
                              >
                                <span className="block font-semibold">{slot.installation?.name ?? 'Installation inconnue'}</span>
                                <span className="mt-1 block text-xs">{savingSlotId === slot.id ? 'Enregistrement...' : status ? statusLabels[status] : 'Sans réponse'}</span>
                                {savedSlotId === slot.id && savingSlotId !== slot.id ? <span className="mt-1 block text-xs font-medium">Enregistré</span> : null}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}