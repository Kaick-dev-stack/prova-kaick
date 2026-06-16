import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export const authService = {
  async signUp(email: string, password: string, username: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        avatar_url: null,
        bio: null,
        favorite_team: null,
      })
      if (profileError && profileError.code !== '23505') {
        throw profileError
      }
    }

    return data
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    if (!isSupabaseConfigured) {
      return
    }
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  async updatePassword(password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },
}
