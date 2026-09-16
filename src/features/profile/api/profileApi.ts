import { supabase } from '../../../services/supabase/client'

export type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  notification_preferences: Record<string, unknown>
}

export type UpdateProfileInput = Pick<Profile, 'first_name' | 'last_name' | 'phone' | 'notification_preferences'>

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Le service Supabase n’est pas configuré.')
  }

  return supabase
}

export async function getOwnProfile(authUserId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, email, phone, notification_preferences')
    .eq('auth_user_id', authUserId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Profile
}

export async function updateOwnProfile(input: UpdateProfileInput) {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('update_own_profile', {
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_phone: input.phone,
    p_notification_preferences: input.notification_preferences,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}