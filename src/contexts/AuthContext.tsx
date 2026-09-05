import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

type Role = 'ADMIN' | 'KASIR' | 'OWNER'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: Role
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isOwner: boolean
  isKasir: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)
    }

    if (data) {
      setProfile(data as Profile)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // Email-based fallback bypass
  const isEmailAdmin = user?.email === 'admin@rsms.com'
  const isEmailOwner = user?.email === 'owner@rsms.com'

  const effectiveRole: Role = profile?.role ?? (isEmailAdmin ? 'ADMIN' : isEmailOwner ? 'OWNER' : 'KASIR')

  const isAdmin = effectiveRole === 'ADMIN'
  const isOwner = effectiveRole === 'OWNER'
  const isKasir = effectiveRole === 'KASIR'

  const effectiveProfile: Profile | null = profile ?? (user ? {
    id: user.id,
    email: user.email ?? '',
    full_name: isEmailAdmin ? 'Admin' : isEmailOwner ? 'Owner' : 'Kasir',
    role: effectiveRole,
  } : null)

  return (
    <AuthContext.Provider value={{
      user,
      profile: effectiveProfile,
      loading,
      signIn,
      signOut,
      isAdmin,
      isOwner,
      isKasir,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
