import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Season } from '../../admin/api/referenceApi'
import { AdminNav } from '../../admin/components/AdminNav'
import { useReferences } from '../../admin/hooks/useReferences'
import {
  trainingPeriodStatuses,
  type TrainingPeriod,
  type TrainingPeriodInput,
  type TrainingPeriodStatus,
} from '../api/trainingPeriodApi'
import { useTrainingPeriods } from '../hooks/useTrainingPeriods'

const statusLabels: Record<TrainingPeriodStatus, string> = {
  PREPARATION: 'Préparation',
  AVAILABILITIES_OPEN: 'Disponibilités ouvertes',
  PLANNING_IN_PROGRESS: 'Planning en cours',
  PUBLISHED: 'Publié',
  COMPLETED: 'Terminé',
  CANCELLED: 'Archivé / annulé',
}

const emptyForm: TrainingPeriodInput = { name: '', season_id: '', start_date: '', end_date: '' }

export function TrainingPeriodsPage() {
  const periods = useTrainingPeriods()
  const seasons = useReferences<Season>('seasons', 'id, name, start_date, end_date, active')
  const { formState: { errors }, getValues, handleSubmit, register, reset } = useForm<TrainingPeriodInput>({
    defaultValues: emptyForm,
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (periods.create.isSuccess || periods.update.isSuccess) reset(emptyForm)
  }, [periods.create.isSuccess, periods.update.isSuccess, reset])

  async function submit(values: TrainingPeriodInput) {
    const input = { ...values, name: values.name.trim() }
    if (editingId) {
      await periods.update.mutateAsync({ id: editingId, input })
      setEditingId(null)
    } else {
      await periods.create.mutateAsync(input)
    }
  }

  function edit(period: TrainingPeriod) {
    setEditingId(period.id)
    reset({
      name: period.name,
      season_id: period.season?.id ?? '',
      start_date: period.start_date,
      end_date: period.end_date,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    reset(emptyForm)
  }

  const requestError = periods.error || seasons.error || periods.create.error || periods.update.error || periods.changeStatus.error || periods.archive.error
  const isSaving = periods.create.isPending || periods.update.isPending

  return (
    <section>
      <AdminNav />
      <h1 className="text-3xl font-semibold">Périodes</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">Gérez les périodes rattachées aux saisons du club.</p>

      <form className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleSubmit(submit)}>
        <input className="border border-stone-300 bg-white px-3 py-2" placeholder="Nom" required {...register('name', { required: true })} />
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('season_id', { required: true })}>
          <option value="">Saison</option>
          {seasons.data?.filter((season) => season.active || season.id === getValues('season_id')).map((season) => (
            <option key={season.id} value={season.id}>{season.name}</option>
          ))}
        </select>
        <input aria-label="Date de début" className="border border-stone-300 bg-white px-3 py-2" required type="date" {...register('start_date', { required: true })} />
        <input
          aria-label="Date de fin"
          className="border border-stone-300 bg-white px-3 py-2"
          required
          type="date"
          {...register('end_date', {
            required: true,
            validate: (value) => value >= getValues('start_date') || 'La date de fin doit être postérieure ou égale à la date de début.',
          })}
        />
        <div className="flex gap-2">
          <button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit">
            {editingId ? 'Modifier' : 'Créer'}
          </button>
          {editingId ? <button className="border border-stone-300 px-4 py-2 text-sm" onClick={cancelEdit} type="button">Annuler</button> : null}
        </div>
      </form>

      {errors.end_date ? <p className="mt-3 text-sm text-red-700" role="alert">{errors.end_date.message}</p> : null}
      {requestError ? <p className="mt-3 text-sm text-red-700" role="alert">{requestError.message}</p> : null}

      {periods.isLoading ? (
        <p className="mt-6 text-sm text-stone-600">Chargement...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-4xl text-left text-sm">
            <thead>
              <tr className="border-b border-stone-300">
                <th className="py-2">Nom</th>
                <th>Saison</th>
                <th>Date de début</th>
                <th>Date de fin</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {periods.data?.map((period) => (
                <tr className="border-b border-stone-200" key={period.id}>
                  <td className="py-3 font-medium">{period.name}</td>
                  <td>{period.season?.name ?? 'Saison inconnue'}</td>
                  <td>{period.start_date}</td>
                  <td>{period.end_date}</td>
                  <td>
                    <select
                      aria-label={`Statut de ${period.name}`}
                      className="border border-stone-300 bg-white px-2 py-1"
                      disabled={periods.changeStatus.isPending || period.status === 'CANCELLED'}
                      onChange={(event) => periods.changeStatus.mutate({ id: period.id, status: event.target.value as TrainingPeriodStatus })}
                      value={period.status}
                    >
                      {trainingPeriodStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                  </td>
                  <td className="flex gap-3 py-3">
                    <button className="text-teal-800" onClick={() => edit(period)} type="button">Modifier</button>
                    {period.status !== 'CANCELLED' ? (
                      <button className="text-red-700" disabled={periods.archive.isPending} onClick={() => periods.archive.mutate(period.id)} type="button">Archiver</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {periods.data?.length === 0 ? <p className="mt-4 text-sm text-stone-600">Aucune période enregistrée.</p> : null}
        </div>
      )}
    </section>
  )
}