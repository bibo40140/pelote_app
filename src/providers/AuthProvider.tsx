import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { supabase } from '../services/supabase/client'
import type { AuthSessionState, AuthState } from '../types/auth'

const initialAuthState: AuthSessionState = {
  isLoading: true,
  session: null,
  user: null,
  role: null,
}

export const AuthContext = createContext<AuthState>({
  ...initialAuthState,
  signIn: async () => 'Le service Supabase n’est pas configuré.',
  signOut: async () => 'Le service Supabase n’est pas configuré.',
})

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthSessionState>(initialAuthState)

  useEffect(() => {
    if (!supabase) {
      setAuthState({ isLoading: false, session: null, user: null, role: null })
      return
    }

    const client = supabase

    async function loadSession() {
      const { data } = await client.auth.getSession()
      await setSession(data.session)
    }

    async function setSession(session: AuthSessionState['session']) {
      if (!session) {
        setAuthState({ isLoading: false, session: null, user: null, role: null })
        return
      }

      const { data } = await client
        .from('profiles')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      setAuthState({
        isLoading: false,
        session,
        user: session.user,
        role: data?.role === 'ADMIN' ? 'ADMIN' : 'PLAYER',
      })
    }

    void loadSession()

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      void setSession(session)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (!supabase) {
      return 'Le service Supabase n’est pas configuré.'
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signOut() {
    if (!supabase) {
      return 'Le service Supabase n’est pas configuré.'
    }

    const { error } = await supabase.auth.signOut()
    return error?.message ?? null
  }

  return <AuthContext value={{ ...authState, signIn, signOut }}>{children}</AuthContext>
}

export function useAuth() {
  return useContext(AuthContext)
}