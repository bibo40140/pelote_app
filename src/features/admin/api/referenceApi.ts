import { supabase } from '../../../services/supabase/client'

export type Season = {
  id: string
  name: string
  start_date: string
  end_date: string
  active: boolean
}

export type NamedReference = {
  id: string
  name: string
  description: string | null
  active: boolean
}

export type Series = Omit<NamedReference, 'description'> & {
  sort_order: number
}

export type Installation = Omit<NamedReference, 'description'> & {
  installation_type_id: string
  address: string | null
}

export type ReferenceTable = 'seasons' | 'disciplines' | 'series' | 'installation_types' | 'installations'

function getClient() {
  if (!supabase) {
    throw new Error('Le service Supabase n’est pas configuré.')
  }

  return supabase
}

export async function listReferences<T>(table: ReferenceTable, columns: string) {
  const { data, error } = await getClient().from(table).select(columns).order('name')

  if (error) throw new Error(error.message)
  return data as T[]
}

export async function createReference<T extends Record<string, unknown>>(table: ReferenceTable, values: T) {
  const { error } = await getClient().from(table).insert(values)
  if (error) throw new Error(error.message)
}

export async function updateReference<T extends Record<string, unknown>>(table: ReferenceTable, id: string, values: T) {
  const { error } = await getClient().from(table).update(values as never).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function archiveReference(table: ReferenceTable, id: string) {
  const { error } = await getClient().from(table).update({ active: false, archived_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}