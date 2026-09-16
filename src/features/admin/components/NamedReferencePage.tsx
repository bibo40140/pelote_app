import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AdminNav } from './AdminNav'
import { useReferences } from '../hooks/useReferences'
import type { NamedReference, ReferenceTable } from '../api/referenceApi'

type FormValues = { name: string; description: string }

export function NamedReferencePage({ table, title }: { table: Extract<ReferenceTable, 'disciplines' | 'installation_types'>; title: string }) {
  const { archive, create, data, error, isLoading, update } = useReferences<NamedReference>(table, 'id, name, description, active')
  const { handleSubmit, register, reset } = useForm<FormValues>({ defaultValues: { name: '', description: '' } })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { if (create.isSuccess || update.isSuccess) reset({ name: '', description: '' }) }, [create.isSuccess, reset, update.isSuccess])

  function edit(item: NamedReference) {
    setEditingId(item.id)
    reset({ name: item.name, description: item.description ?? '' })
  }

  async function submit(values: FormValues) {
    const payload = { name: values.name.trim(), description: values.description.trim() || null }
    if (editingId) {
      await update.mutateAsync({ id: editingId, values: payload })
      setEditingId(null)
    } else {
      await create.mutateAsync(payload)
    }
  }

  return <section><AdminNav /><h1 className="text-3xl font-semibold">{title}</h1><form className="mt-6 grid gap-3 sm:grid-cols-3" onSubmit={handleSubmit(submit)}><input className="border border-stone-300 bg-white px-3 py-2" placeholder="Nom" required {...register('name', { required: true })} /><input className="border border-stone-300 bg-white px-3 py-2" placeholder="Description facultative" {...register('description')} /><button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white" type="submit">{editingId ? 'Modifier' : 'Créer'}</button></form>{(create.error || update.error || archive.error || error) ? <p className="mt-3 text-sm text-red-700" role="alert">{(create.error || update.error || archive.error || error)?.message}</p> : null}{(create.isSuccess || update.isSuccess || archive.isSuccess) ? <p className="mt-3 text-sm text-teal-800" role="status">Enregistrement effectué.</p> : null}{isLoading ? <p className="mt-6 text-sm text-stone-600">Chargement...</p> : <table className="mt-6 w-full border-collapse text-left text-sm"><thead><tr className="border-b border-stone-300"><th className="py-2">Nom</th><th>Description</th><th>Statut</th><th /></tr></thead><tbody>{data?.map((item) => <tr className="border-b border-stone-200" key={item.id}><td className="py-3">{item.name}</td><td>{item.description ?? '—'}</td><td>{item.active ? 'Actif' : 'Archivé'}</td><td className="flex gap-3 py-3"><button className="text-teal-800" onClick={() => edit(item)} type="button">Modifier</button>{item.active ? <button className="text-red-700" onClick={() => archive.mutate(item.id)} type="button">Archiver</button> : null}</td></tr>)}</tbody></table>}</section>
}