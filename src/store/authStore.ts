import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      fetchProfile: async (userId: string) => {
        if (!isSupabaseConfigured) return

        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!error && data) {
          set({ profile: data as Profile })
        }
      },

      signOut: async () => {
        if (!isSupabaseConfigured) {
          set({ user: null, profile: null })
          return
        }

        const supabase = getSupabaseClient()
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },

      initialize: async () => {
        if (!isSupabaseConfigured) {
          set({ loading: false, initialized: true })
          return
        }

        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          set({ user: session.user })
          await get().fetchProfile(session.user.id)
        } else {
          // Clear any stale persisted user if there's no active session
          set({ user: null, profile: null })
        }
        set({ loading: false, initialized: true })

        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            set({ user: session.user })
            await get().fetchProfile(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, profile: null })
          }
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
)
