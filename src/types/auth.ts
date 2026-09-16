import type { Session, User } from '@supabase/supabase-js'

export type ProfileRole = 'PLAYER' | 'ADMIN'

export type AuthSessionState = {
  isLoading: boolean
  session: Session | null
  user: User | null
  role: ProfileRole | null
}

export type AuthState = AuthSessionState & {
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<string | null>
}