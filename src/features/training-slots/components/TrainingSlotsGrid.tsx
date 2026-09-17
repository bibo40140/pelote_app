import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Installation, NamedReference } from '../../admin/api/referenceApi'
import type { TrainingPeriod } from '../../training-periods/api/trainingPeriodApi'
import type { TrainingSlot, TrainingSlotGridInput, TrainingSlotGridResult } from '../api/trainingSlotApi'

const weekdays = [
  [1, 'Lundi'],
  [2, 'Mardi'],
  [3, 'Mercredi'],
  [4, 'Jeudi'],
  [5, 'Vendredi'],
] as const

const availableHours = Array.from({ length: 24 }, (_, hour) => hour)

type GridCriteria = Pick<TrainingSlotGridInput, 'training_period_id' | 'discipline_id' | 'installation_id'>

type Props = {
  periods: TrainingPeriod[]
  disciplines: NamedReference[]
  installations: Installation[]
  slots: TrainingSlot[]
  isPending: boolean
  onCreate: (input: TrainingSlotGridInput) => Promise<TrainingSlotGridResult>
}

function cellKey(day: number, hour: number) {
  return `${day}-${hour}`
}

export function TrainingSlotsGrid({ periods, disciplines, installations, slots, isPending, onCreate }: Props) {
  const { register, watch } = useForm<GridCriteria>({
    defaultValues: { training_period_id: '', discipline_id: '', installation_id: '' },
  })
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<TrainingSlotGridResult | null>(null)
  const [startHour, setStartHour] = useState(8)
  const [endHour, setEndHour] = useState(23)
  const criteria = watch()
  const criteriaSelected = Boolean(criteria.training_period_id && criteria.discipline_id && criteria.installation_id)
  const selectedInstallation = installations.find((installation) => installation.id === criteria.installation_id)
  const hours = Array.from({ length: Math.max(0, endHour - startHour) }, (_, index) => startHour + index)
  const validTimeRange = endHour > startHour

  function changeTimeRange(setHour: (hour: number) => void, hour: number) {
    setHour(hour)
    setSelectedCells(new Set())
    setResult(null)
  }

  const isDuplicate = (day: number, hour: number) => slots.some((slot) =>
    slot.period?.id === criteria.training_period_id
    && slot.discipline?.id === criteria.discipline_id
    && slot.installation?.id === criteria.installation_id
    && slot.day_of_week === day
    && slot.start_time.slice(0, 5) === `${String(hour).padStart(2, '0')}:00`
    && slot.end_time.slice(0, 5) === `${String(hour + 1).padStart(2, '0')}:00`,
  )

  const duplicateCount = [...selectedCells].filter((key) => {
    const [day, hour] = key.split('-').map(Number)
    return isDuplicate(day, hour)
  }).length
  const createCount = selectedCells.size - duplicateCount

  function toggleCell(day: number, hour: number) {
    if (!criteriaSelected) return
    setResult(null)
    setSelectedCells((current) => {
      const next = new Set(current)
      const key = cellKey(day, hour)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function createSelected() {
    if (!criteriaSelected || selectedCells.size === 0) return
    const cells = [...selectedCells].map((key) => {
      const [day, hour] = key.split('-').map(Number)
      return {
        day_of_week: day,
        start_time: `${String(hour).padStart(2, '0')}:00`,
        end_time: `${String(hour + 1).padStart(2, '0')}:00`,
      }
    })
    const creationResult = await onCreate({ ...criteria, cells })
    setResult(creationResult)
    setSelectedCells(new Set())
  }

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <select className="border border-stone-300 bg-white px-3 py-2" {...register('training_period_id', { onChange: () => { setSelectedCells(new Set()); setResult(null) } })}>
          <option value="">Période</option>
          {periods.filter((period) => period.status !== 'CANCELLED').map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
        </select>
        <select className="border border-stone-300 bg-white px-3 py-2" {...register('discipline_id', { onChange: () => { setSelectedCells(new Set()); setResult(null) } })}>
          <option value="">Discipline</option>
          {disciplines.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="border border-stone-300 bg-white px-3 py-2" {...register('installation_id', { onChange: () => { setSelectedCells(new Set()); setResult(null) } })}>
          <option value="">Installation</option>
          {installations.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {!criteriaSelected ? <p className="mt-3 text-sm text-stone-600">Sélectionnez d’abord une période, une discipline et une installation.</p> : null}
      {selectedInstallation ? (
        <div className="mt-4 border-l-4 border-teal-700 bg-teal-50 px-4 py-3 text-sm text-stone-700">
          <span className="font-medium">Installation :</span>{' '}
          <strong className="text-base text-teal-900">{selectedInstallation.name}</strong>
          {selectedInstallation.address ? <span className="ml-2 text-stone-600">- {selectedInstallation.address}</span> : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-end gap-3 border-y border-stone-200 bg-stone-50 px-4 py-4">
        <label className="grid gap-1 text-sm font-medium text-stone-700">
          Heure début affichée
          <select className="min-w-28 border border-stone-300 bg-white px-3 py-2 font-normal" onChange={(event) => changeTimeRange(setStartHour, Number(event.target.value))} value={startHour}>
            {availableHours.slice(0, 23).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}h</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-stone-700">
          Heure fin affichée
          <select className="min-w-28 border border-stone-300 bg-white px-3 py-2 font-normal" onChange={(event) => changeTimeRange(setEndHour, Number(event.target.value))} value={endHour}>
            {availableHours.slice(1).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}h</option>)}
          </select>
        </label>
        {!validTimeRange ? <p className="pb-2 text-sm text-red-700" role="alert">L’heure de fin doit être postérieure à l’heure de début.</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600" aria-label="Légende de la grille">
        <span className="flex items-center gap-2"><span className="size-3 border border-stone-300 bg-white" />Vide</span>
        <span className="flex items-center gap-2"><span className="size-3 bg-teal-700" />Sélectionné</span>
        <span className="flex items-center gap-2"><span className="size-3 border border-amber-400 bg-amber-100" />Créneau existant</span>
      </div>

      <div className="mt-3 overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-3xl table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 border-b border-r border-stone-300 bg-stone-100 px-3 py-4 text-left font-semibold text-stone-700" scope="col">Horaire</th>
              {weekdays.map(([, label]) => (
                <th className="border-b border-r border-stone-300 bg-stone-100 px-3 py-4 text-center font-semibold text-stone-800 last:border-r-0" key={label} scope="col">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <th className="border-b border-r border-stone-300 bg-stone-50 px-3 py-5 text-left font-semibold whitespace-nowrap text-stone-700 last:border-b-0" scope="row">
                  {hour}h-{hour + 1}h
                </th>
                {weekdays.map(([day, label]) => {
                  const key = cellKey(day, hour)
                  const selected = selectedCells.has(key)
                  const duplicate = criteriaSelected && isDuplicate(day, hour)
                  return (
                    <td className="h-24 border-b border-r border-stone-300 p-2 last:border-r-0" key={key}>
                      <button
                        aria-label={`${label} de ${hour}h à ${hour + 1}h${duplicate ? ', créneau existant' : ''}`}
                        aria-pressed={selected}
                        className={`flex size-full min-h-20 flex-col items-center justify-center gap-2 border-2 px-2 py-3 text-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-teal-800 bg-teal-700 text-white' : duplicate ? 'border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100' : 'border-transparent bg-white text-stone-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900'}`}
                        disabled={!criteriaSelected || !validTimeRange}
                        onClick={() => toggleCell(day, hour)}
                        type="button"
                      >
                        <span>{selected ? 'Sélectionné' : 'Ajouter'}</span>
                        {duplicate ? <span className={`border px-2 py-0.5 text-xs font-semibold ${selected ? 'border-white/60 bg-white/15 text-white' : 'border-amber-400 bg-amber-100 text-amber-900'}`}>Existant</span> : null}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!criteriaSelected || !validTimeRange || selectedCells.size === 0 || isPending} onClick={createSelected} type="button">
          {isPending ? 'Création...' : 'Créer les créneaux sélectionnés'}
        </button>
        <p className="text-sm text-stone-700">
          {selectedCells.size} sélectionné(s), {duplicateCount} doublon(s) ignoré(s), {createCount} à créer.
        </p>
      </div>
      {result ? <p className="mt-3 text-sm text-teal-800" role="status">{result.created} créneau(x) créé(s). {result.skipped} doublon(s) ignoré(s).</p> : null}
    </div>
  )
}