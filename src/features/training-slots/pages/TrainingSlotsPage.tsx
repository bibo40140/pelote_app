import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Installation, NamedReference } from '../../admin/api/referenceApi'
import { AdminNav } from '../../admin/components/AdminNav'
import { useReferences } from '../../admin/hooks/useReferences'
import type { TrainingPeriod } from '../../training-periods/api/trainingPeriodApi'
import { useTrainingPeriods } from '../../training-periods/hooks/useTrainingPeriods'
import type { TrainingSlot, TrainingSlotInput } from '../api/trainingSlotApi'
import { useTrainingSlots } from '../hooks/useTrainingSlots'
import { TrainingSlotsGrid } from '../components/TrainingSlotsGrid'

const days = [
  [1, 'Lundi'],
  [2, 'Mardi'],
  [3, 'Mercredi'],
  [4, 'Jeudi'],
  [5, 'Vendredi'],
  [6, 'Samedi'],
  [7, 'Dimanche'],
] as const

type FormValues = Omit<TrainingSlotInput, 'day_of_week'> & { day_of_week: string }

const emptyForm: FormValues = {
  training_period_id: '',
  day_of_week: '',
  start_time: '',
  end_time: '',
  discipline_id: '',
  installation_id: '',
}

export function TrainingSlotsPage() {
  const slots = useTrainingSlots()
  const periods = useTrainingPeriods()
  const disciplines = useReferences<NamedReference>('disciplines', 'id, name, description, active')
  const installations = useReferences<Installation>('installations', 'id, name, installation_type_id, address, active')
  const { formState: { errors }, getValues, handleSubmit, register, reset } = useForm<FormValues>({ defaultValues: emptyForm })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creationMode, setCreationMode] = useState<'single' | 'grid'>('single')

  async function submit(values: FormValues) {
    const input: TrainingSlotInput = { ...values, day_of_week: Number(values.day_of_week) }
    if (editingId) {
      await slots.update.mutateAsync({ id: editingId, input })
      setEditingId(null)
    } else {
      await slots.create.mutateAsync(input)
    }
    reset(emptyForm)
  }

  function edit(slot: TrainingSlot) {
    setEditingId(slot.id)
    reset({
      training_period_id: slot.period?.id ?? '',
      day_of_week: String(slot.day_of_week),
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      discipline_id: slot.discipline?.id ?? '',
      installation_id: slot.installation?.id ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    reset(emptyForm)
  }

  const requestError = slots.error || periods.error || disciplines.error || installations.error || slots.create.error || slots.createGrid.error || slots.update.error || slots.archive.error
  const isSaving = slots.create.isPending || slots.update.isPending

  return (
    <section>
      <AdminNav />
      <h1 className="text-3xl font-semibold">Créneaux</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">Gérez les créneaux hebdomadaires des périodes d’entraînement.</p>

      <div className="mt-6 flex gap-2" role="group" aria-label="Mode de création">
        <button className={`border px-4 py-2 text-sm font-semibold ${creationMode === 'single' ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-white'}`} onClick={() => setCreationMode('single')} type="button">Création unitaire</button>
        <button className={`border px-4 py-2 text-sm font-semibold ${creationMode === 'grid' ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-white'}`} onClick={() => setCreationMode('grid')} type="button">Création en grille</button>
      </div>

      {creationMode === 'single' ? <form className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit(submit)}>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('training_period_id', { required: 'La période est obligatoire.' })}>
          <option value="">Période</option>
          {periods.data?.filter((period: TrainingPeriod) => period.status !== 'CANCELLED' || period.id === getValues('training_period_id')).map((period: TrainingPeriod) => (
            <option key={period.id} value={period.id}>{period.name}</option>
          ))}
        </select>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('day_of_week', { required: 'Le jour est obligatoire.' })}>
          <option value="">Jour de la semaine</option>
          {days.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input aria-label="Heure de début" className="border border-stone-300 bg-white px-3 py-2" required type="time" {...register('start_time', { required: 'L’heure de début est obligatoire.' })} />
        <input
          aria-label="Heure de fin"
          className="border border-stone-300 bg-white px-3 py-2"
          required
          type="time"
          {...register('end_time', {
            required: 'L’heure de fin est obligatoire.',
            validate: (value) => value > getValues('start_time') || 'L’heure de fin doit être postérieure à l’heure de début.',
          })}
        />
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('discipline_id', { required: 'La discipline est obligatoire.' })}>
          <option value="">Discipline</option>
          {disciplines.data?.filter((item) => item.active || item.id === getValues('discipline_id')).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('installation_id', { required: 'L’installation est obligatoire.' })}>
          <option value="">Installation</option>
          {installations.data?.filter((item) => item.active || item.id === getValues('installation_id')).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <div className="flex gap-2 sm:col-span-2">
          <button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit">{editingId ? 'Modifier' : 'Créer'}</button>
          {editingId ? <button className="border border-stone-300 px-4 py-2 text-sm" onClick={cancelEdit} type="button">Annuler</button> : null}
        </div>
      </form> : (
        <TrainingSlotsGrid
          disciplines={disciplines.data ?? []}
          installations={installations.data ?? []}
          isPending={slots.createGrid.isPending}
          onCreate={slots.createGrid.mutateAsync}
          periods={periods.data ?? []}
          slots={slots.data ?? []}
        />
      )}

      {Object.values(errors)[0]?.message ? <p className="mt-3 text-sm text-red-700" role="alert">{Object.values(errors)[0]?.message}</p> : null}
      {requestError ? <p className="mt-3 text-sm text-red-700" role="alert">{requestError.message}</p> : null}

      {slots.isLoading ? (
        <p className="mt-6 text-sm text-stone-600">Chargement...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-4xl text-left text-sm">
            <thead><tr className="border-b border-stone-300"><th className="py-2">Période</th><th>Jour</th><th>Début</th><th>Fin</th><th>Discipline</th><th>Installation</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {slots.data?.map((slot) => (
                <tr className="border-b border-stone-200" key={slot.id}>
                  <td className="py-3">{slot.period?.name ?? 'Période inconnue'}</td>
                  <td>{days.find(([value]) => value === slot.day_of_week)?.[1] ?? slot.day_of_week}</td>
                  <td>{slot.start_time.slice(0, 5)}</td>
                  <td>{slot.end_time.slice(0, 5)}</td>
                  <td>{slot.discipline?.name ?? 'Discipline inconnue'}</td>
                  <td>{slot.installation?.name ?? 'Installation inconnue'}</td>
                  <td>{slot.active ? 'Actif' : 'Archivé'}</td>
                  <td className="flex gap-3 py-3">
                    <button className="text-teal-800" onClick={() => edit(slot)} type="button">Modifier</button>
                    {slot.active ? <button className="text-red-700" disabled={slots.archive.isPending} onClick={() => slots.archive.mutate(slot.id)} type="button">Archiver</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {slots.data?.length === 0 ? <p className="mt-4 text-sm text-stone-600">Aucun créneau enregistré.</p> : null}
        </div>
      )}
    </section>
  )
}