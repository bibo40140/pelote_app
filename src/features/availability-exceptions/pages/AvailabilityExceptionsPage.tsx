import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AvailabilityGrid } from '../../availabilities/components/AvailabilityGrid'
import type { AvailabilitySlot } from '../../availabilities/api/availabilityApi'
import type { AvailabilityException, ExceptionSlot, UnavailabilityPeriodInput } from '../api/availabilityExceptionApi'
import { useAvailabilityExceptions } from '../hooks/useAvailabilityExceptions'

const dayNames: Record<number, string> = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche' }
type Scope = 'slot' | 'day'

type ModalState = {
  slot: ExceptionSlot
  step: 'dates' | 'scope'
  selectedDates: Set<string>
  scope: Scope
  reason: string
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(toDate(value))
}

function slotLabel(slot: ExceptionSlot) {
  return `${dayNames[slot.day_of_week]} ${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`
}

function getSlotDates(slot: ExceptionSlot) {
  if (!slot.period) return []
  const dates: string[] = []
  const current = toDate(slot.period.start_date)
  const end = toDate(slot.period.end_date)
  while (current <= end) {
    if ((current.getUTCDay() || 7) === slot.day_of_week) dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

function isSlotOnDate(slot: ExceptionSlot, date: string) {
  return Boolean(slot.period)
    && date >= slot.period!.start_date
    && date <= slot.period!.end_date
    && (toDate(date).getUTCDay() || 7) === slot.day_of_week
}

export function AvailabilityExceptionsPage() {
  const exceptions = useAvailabilityExceptions()
  const [mode, setMode] = useState<'punctual' | 'period'>('punctual')
  const [periodId, setPeriodId] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [batchResult, setBatchResult] = useState<{ saved: number; errors: { message: string }[] } | null>(null)
  const periodForm = useForm<UnavailabilityPeriodInput>({ defaultValues: { start_date: '', end_date: '', reason: '' } })

  const positiveSlots = (exceptions.data?.slots ?? []).filter((slot) => slot.recurringStatus === 'AVAILABLE' || slot.recurringStatus === 'PREFERRED')
  const periods = [...new Map(positiveSlots.flatMap((slot) => slot.period ? [[slot.period.id, slot.period] as const] : [])).values()]
  const periodSlots = positiveSlots.filter((slot) => slot.period?.id === periodId)
  const disciplines = [...new Map(periodSlots.flatMap((slot) => slot.discipline ? [[slot.discipline.id, slot.discipline] as const] : [])).values()]
  const visibleSlots = periodSlots.filter((slot) => slot.discipline?.id === disciplineId)
  const activeExceptions = exceptions.data?.exceptions ?? []
  const punctualExceptions = activeExceptions.filter((item) => item.slot)
  const periodExceptions = activeExceptions.filter((item) => !item.slot)

  useEffect(() => {
    if (!periodId || !periods.some((period) => period.id === periodId)) setPeriodId(periods[0]?.id ?? '')
  }, [periodId, periods])

  useEffect(() => {
    if (!disciplineId || !disciplines.some((discipline) => discipline.id === disciplineId)) setDisciplineId(disciplines[0]?.id ?? '')
  }, [disciplineId, disciplines])

  const gridSlots: AvailabilitySlot[] = visibleSlots.map((slot) => ({
    id: slot.id,
    day_of_week: slot.day_of_week,
    start_time: slot.start_time,
    end_time: slot.end_time,
    period: slot.period,
    discipline: slot.discipline,
    installation: slot.installation,
    availabilityStatus: slot.recurringStatus === 'PREFERRED' ? 'PREFERRED' : 'AVAILABLE',
  }))

  function openModal(clickedSlot: AvailabilitySlot) {
    const slot = positiveSlots.find((item) => item.id === clickedSlot.id)
    if (!slot) return
    setBatchResult(null)
    setModal({ slot, step: 'dates', selectedDates: new Set(), scope: 'slot', reason: '' })
  }

  function toggleDate(date: string) {
    setModal((current) => {
      if (!current) return current
      const selectedDates = new Set(current.selectedDates)
      if (selectedDates.has(date)) selectedDates.delete(date)
      else selectedDates.add(date)
      return { ...current, selectedDates }
    })
  }

  async function savePunctualExceptions() {
    if (!modal || modal.selectedDates.size === 0) return
    const inputs = [...modal.selectedDates].flatMap((date) => {
      const slots = modal.scope === 'slot'
        ? [modal.slot]
        : positiveSlots.filter((slot) => isSlotOnDate(slot, date))
      return slots.map((slot) => ({
        training_slot_id: slot.id,
        exception_date: date,
        exception_type: 'UNAVAILABLE_EXCEPTION' as const,
        reason: modal.reason.trim(),
      }))
    })
    const uniqueInputs = [...new Map(inputs.map((input) => [`${input.training_slot_id}-${input.exception_date}`, input])).values()]
    const result = await exceptions.saveMany.mutateAsync(uniqueInputs)
    setBatchResult(result)
    if (result.errors.length === 0) setModal(null)
  }

  async function submitPeriod(values: UnavailabilityPeriodInput) {
    await exceptions.createPeriod.mutateAsync({ ...values, reason: values.reason.trim() })
    periodForm.reset()
  }

  const requestError = exceptions.error || exceptions.saveMany.error || exceptions.createPeriod.error || exceptions.cancel.error
  const success = exceptions.createPeriod.isSuccess || exceptions.cancel.isSuccess

  return (
    <section>
      <h1 className="text-3xl font-semibold">Mes exceptions</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">Cliquez sur un créneau habituellement disponible pour signaler une absence.</p>

      <div className="mt-6 grid grid-cols-2 border-b border-stone-300" role="tablist" aria-label="Type d’absence">
        <button aria-selected={mode === 'punctual'} className={`border border-b-0 px-3 py-3 text-sm font-semibold ${mode === 'punctual' ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-white text-stone-700'}`} onClick={() => setMode('punctual')} role="tab" type="button">Absence ponctuelle</button>
        <button aria-selected={mode === 'period'} className={`border border-b-0 px-3 py-3 text-sm font-semibold ${mode === 'period' ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-white text-stone-700'}`} onClick={() => setMode('period')} role="tab" type="button">Absence sur une période</button>
      </div>

      {mode === 'punctual' ? (
        <div className="mt-5">
          {exceptions.isLoading ? <p className="text-sm text-stone-600">Chargement...</p> : periods.length === 0 ? <p className="text-sm text-stone-600">Aucune période ouverte avec une disponibilité habituelle.</p> : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium">Période<select className="border border-stone-300 bg-white px-3 py-2 font-normal" onChange={(event) => setPeriodId(event.target.value)} value={periodId}>{periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}</select></label>
                <label className="grid gap-1 text-sm font-medium">Discipline<select className="border border-stone-300 bg-white px-3 py-2 font-normal" onChange={(event) => setDisciplineId(event.target.value)} value={disciplineId}>{disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}</select></label>
              </div>
              {gridSlots.length === 0 ? <p className="mt-5 text-sm text-stone-600">Aucune disponibilité Disponible ou Préféré pour ces critères.</p> : <AvailabilityGrid onCycle={openModal} savedSlotId={null} savingSlotId={null} slots={gridSlots} />}
            </>
          )}
        </div>
      ) : (
        <form className="mt-5 grid gap-4 border border-stone-300 bg-white p-4 sm:grid-cols-2" onSubmit={periodForm.handleSubmit(submitPeriod)}>
          <div className="sm:col-span-2"><h2 className="text-lg font-semibold">Déclarer une absence</h2><p className="mt-1 text-sm text-stone-600">Cette absence vous rend indisponible sur tous les créneaux compris entre ces deux dates.</p></div>
          <label className="grid gap-1 text-sm font-medium">Date de début<input className="border border-stone-300 bg-white px-3 py-2 font-normal" required type="date" {...periodForm.register('start_date', { required: true })} /></label>
          <label className="grid gap-1 text-sm font-medium">Date de fin<input className="border border-stone-300 bg-white px-3 py-2 font-normal" required type="date" {...periodForm.register('end_date', { required: true, validate: (value) => value >= periodForm.getValues('start_date') || 'La date de fin doit être postérieure ou égale à la date de début.' })} /></label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">Motif facultatif<input className="border border-stone-300 bg-white px-3 py-2 font-normal" {...periodForm.register('reason')} /></label>
          {periodForm.formState.errors.end_date ? <p className="text-sm text-red-700 sm:col-span-2" role="alert">{periodForm.formState.errors.end_date.message}</p> : null}
          <button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-fit" disabled={exceptions.createPeriod.isPending} type="submit">{exceptions.createPeriod.isPending ? 'Enregistrement...' : 'Enregistrer l’absence'}</button>
        </form>
      )}

      {batchResult ? <div className={`mt-4 border px-4 py-3 text-sm ${batchResult.errors.length ? 'border-amber-400 bg-amber-50 text-amber-950' : 'border-teal-600 bg-teal-50 text-teal-900'}`} role="status"><strong>{batchResult.saved} exception(s) enregistrée(s).</strong>{batchResult.errors.length ? <><p className="mt-1">{batchResult.errors.length} erreur(s) :</p><ul className="mt-1 list-disc pl-5">{batchResult.errors.map((error, index) => <li key={`${error.message}-${index}`}>{error.message}</li>)}</ul></> : null}</div> : null}
      {requestError ? <p className="mt-4 text-sm text-red-700" role="alert">{requestError.message}</p> : null}
      {success ? <p className="mt-4 text-sm font-medium text-teal-800" role="status">Opération enregistrée.</p> : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <ExceptionList emptyText="Aucune exception ponctuelle active." exceptions={punctualExceptions} isPending={exceptions.cancel.isPending} onCancel={(id) => exceptions.cancel.mutate(id)} title="Exceptions ponctuelles" />
        <ExceptionList emptyText="Aucune absence active." exceptions={periodExceptions} isPending={exceptions.cancel.isPending} onCancel={(id) => exceptions.cancel.mutate(id)} title="Absences sur une période" />
      </div>

      {modal ? <ExceptionModal batchResult={batchResult} existingExceptions={punctualExceptions} isPending={exceptions.saveMany.isPending} modal={modal} onBack={() => setModal((current) => current ? { ...current, step: 'dates' } : current)} onClose={() => setModal(null)} onContinue={() => setModal((current) => current ? { ...current, step: 'scope' } : current)} onReasonChange={(reason) => setModal((current) => current ? { ...current, reason } : current)} onSave={savePunctualExceptions} onScopeChange={(scope) => setModal((current) => current ? { ...current, scope } : current)} onToggleDate={toggleDate} /> : null}
    </section>
  )
}

type ModalProps = {
  modal: ModalState
  batchResult: { saved: number; errors: { message: string }[] } | null
  existingExceptions: AvailabilityException[]
  isPending: boolean
  onBack: () => void
  onClose: () => void
  onContinue: () => void
  onToggleDate: (date: string) => void
  onScopeChange: (scope: Scope) => void
  onReasonChange: (reason: string) => void
  onSave: () => void
}

function ExceptionModal({ modal, batchResult, existingExceptions, isPending, onBack, onClose, onContinue, onToggleDate, onScopeChange, onReasonChange, onSave }: ModalProps) {
  const dates = getSlotDates(modal.slot)
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isPending, onClose])

  return <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" role="dialog"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-stone-300 bg-white p-5 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Signaler une absence</h2><p className="mt-1 text-sm text-stone-700">{slotLabel(modal.slot)} · {modal.slot.discipline?.name} · {modal.slot.installation?.name}</p><p className="mt-1 text-sm text-stone-600">{modal.slot.period?.name}</p></div><button aria-label="Fermer" className="border border-stone-300 px-3 py-1.5 text-lg" disabled={isPending} onClick={onClose} type="button">×</button></div>{modal.step === 'dates' ? <><fieldset className="mt-6"><legend className="text-sm font-semibold">Sélectionnez les dates concernées</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{dates.map((date) => { const existing = existingExceptions.find((item) => item.slot?.id === modal.slot.id && item.start_date === date); const selected = modal.selectedDates.has(date); return <label className={`flex cursor-pointer items-start gap-3 border px-3 py-3 text-sm ${selected ? 'border-teal-700 bg-teal-50' : 'border-stone-300'}`} key={date}><input className="mt-0.5 size-4 accent-teal-700" checked={selected} onChange={() => onToggleDate(date)} type="checkbox" /><span><strong className="block">{formatDate(date)}</strong>{existing ? <span className="mt-1 block text-xs font-medium text-amber-800">Exception active : {existing.exception_type === 'UNAVAILABLE_EXCEPTION' ? 'absence' : 'disponibilité exceptionnelle'}{existing.exception_type === 'AVAILABLE_EXCEPTION' ? ' (sera remplacée)' : ''}</span> : null}</span></label> })}</div></fieldset><div className="mt-5 flex gap-2"><button className="border border-stone-300 px-4 py-2 text-sm" onClick={onClose} type="button">Annuler</button><button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={modal.selectedDates.size === 0} onClick={onContinue} type="button">Continuer</button></div></> : <><fieldset className="mt-6"><legend className="text-sm font-semibold">Cette absence concerne-t-elle uniquement ce créneau ou toute la journée ?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className={`cursor-pointer border p-4 text-sm ${modal.scope === 'slot' ? 'border-teal-700 bg-teal-50' : 'border-stone-300'}`}><input className="mr-2 accent-teal-700" checked={modal.scope === 'slot'} name="scope" onChange={() => onScopeChange('slot')} type="radio" />Exception uniquement sur ce créneau</label><label className={`cursor-pointer border p-4 text-sm ${modal.scope === 'day' ? 'border-teal-700 bg-teal-50' : 'border-stone-300'}`}><input className="mr-2 accent-teal-700" checked={modal.scope === 'day'} name="scope" onChange={() => onScopeChange('day')} type="radio" />Indisponible toute la journée</label></div></fieldset><label className="mt-5 grid gap-1 text-sm font-medium">Motif facultatif<input className="border border-stone-300 px-3 py-2 font-normal" onChange={(event) => onReasonChange(event.target.value)} value={modal.reason} /></label>{batchResult?.errors.length ? <div className="mt-4 border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status"><strong>{batchResult.saved} exception(s) enregistrée(s), {batchResult.errors.length} erreur(s).</strong><ul className="mt-1 list-disc pl-5">{batchResult.errors.map((error, index) => <li key={`${error.message}-${index}`}>{error.message}</li>)}</ul></div> : null}<div className="mt-5 flex flex-wrap gap-2"><button className="border border-stone-300 px-4 py-2 text-sm" disabled={isPending} onClick={onBack} type="button">Retour</button><button className="border border-stone-300 px-4 py-2 text-sm" disabled={isPending} onClick={onClose} type="button">Annuler</button><button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isPending} onClick={onSave} type="button">{isPending ? 'Enregistrement...' : 'Valider'}</button></div></>}</div></div>
}

type ExceptionListProps = { title: string; emptyText: string; exceptions: AvailabilityException[]; isPending: boolean; onCancel: (id: string) => void }
function ExceptionList({ title, emptyText, exceptions, isPending, onCancel }: ExceptionListProps) {
  return <div><h2 className="text-xl font-semibold">{title}</h2><div className="mt-3 grid gap-3">{exceptions.length === 0 ? <p className="text-sm text-stone-600">{emptyText}</p> : exceptions.map((exception) => <article className="border border-stone-300 bg-white p-4" key={exception.id}><p className="text-sm font-semibold">{exception.slot ? `${formatDate(exception.start_date)} · ${dayNames[exception.slot.day_of_week]} · ${exception.slot.start_time.slice(0, 5)}-${exception.slot.end_time.slice(0, 5)}` : `${formatDate(exception.start_date)} au ${formatDate(exception.end_date)}`}</p>{exception.slot ? <p className="mt-1 text-sm text-stone-600">{exception.slot.discipline?.name} · {exception.slot.installation?.name}</p> : null}{exception.reason ? <p className="mt-1 text-sm text-stone-600">{exception.reason}</p> : null}<button className="mt-3 text-sm font-medium text-red-700" disabled={isPending} onClick={() => onCancel(exception.id)} type="button">Annuler</button></article>)}</div></div>
}
