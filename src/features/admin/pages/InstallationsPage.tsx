import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AdminNav } from '../components/AdminNav'
import { useReferences } from '../hooks/useReferences'
import type { Installation, NamedReference } from '../api/referenceApi'

type FormValues = { name: string; installation_type_id: string; address: string }

export function InstallationsPage() {
  const installations = useReferences<Installation>('installations', 'id, name, installation_type_id, address, active')
  const installationTypes = useReferences<NamedReference>('installation_types', 'id, name, description, active')
  const { handleSubmit, register, reset } = useForm<FormValues>({ defaultValues: { name: '', installation_type_id: '', address: '' } })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (installations.create.isSuccess || installations.update.isSuccess) {
      reset({ name: '', installation_type_id: '', address: '' })
    }
  }, [installations.create.isSuccess, installations.update.isSuccess, reset])

  const typeName = (typeId: string) => installationTypes.data?.find((type) => type.id === typeId)?.name ?? 'Type inconnu'

  async function submit(values: FormValues) {
    const payload = {
      name: values.name.trim(),
      installation_type_id: values.installation_type_id,
      address: values.address.trim() || null,
    }

    if (editingId) {
      await installations.update.mutateAsync({ id: editingId, values: payload })
      setEditingId(null)
    } else {
      await installations.create.mutateAsync(payload)
    }
  }

  const requestError = installations.error || installationTypes.error || installations.create.error || installations.update.error || installations.archive.error

  return (
    <section>
      <AdminNav />
      <h1 className="text-3xl font-semibold">Installations</h1>
      <form className="mt-6 grid gap-3 sm:grid-cols-4" onSubmit={handleSubmit(submit)}>
        <input className="border border-stone-300 bg-white px-3 py-2" placeholder="Nom" required {...register('name', { required: true })} />
        <select className="border border-stone-300 bg-white px-3 py-2" required {...register('installation_type_id', { required: true })}>
          <option value="">Type d’installation</option>
          {installationTypes.data?.filter((type) => type.active).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <input className="border border-stone-300 bg-white px-3 py-2" placeholder="Adresse facultative" {...register('address')} />
        <button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white" disabled={installations.create.isPending || installations.update.isPending} type="submit">
          {editingId ? 'Modifier' : 'Créer'}
        </button>
      </form>
      {requestError ? <p className="mt-3 text-sm text-red-700" role="alert">{requestError.message}</p> : null}
      {installations.isLoading ? <p className="mt-6 text-sm text-stone-600">Chargement...</p> : <table className="mt-6 w-full text-left text-sm"><thead><tr><th>Nom</th><th>Type</th><th>Adresse</th><th>Statut</th><th /></tr></thead><tbody>{installations.data?.map((item) => <tr className="border-b border-stone-200" key={item.id}><td className="py-3">{item.name}</td><td>{typeName(item.installation_type_id)}</td><td>{item.address ?? '—'}</td><td>{item.active ? 'Active' : 'Archivée'}</td><td className="flex gap-3 py-3"><button className="text-teal-800" onClick={() => { setEditingId(item.id); reset({ name: item.name, installation_type_id: item.installation_type_id, address: item.address ?? '' }) }} type="button">Modifier</button>{item.active ? <button className="text-red-700" onClick={() => installations.archive.mutate(item.id)} type="button">Archiver</button> : null}</td></tr>)}</tbody></table>}
    </section>
  )
}