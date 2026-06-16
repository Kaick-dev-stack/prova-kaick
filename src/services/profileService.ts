import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile } from '@/types'

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as Profile
  },

  async getProfileWithStats(userId: string, currentUserId?: string): Promise<Profile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    const [followersRes, followingRes, stickersRes, isFollowingRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
      supabase.from('stickers').select('id', { count: 'exact' }).eq('user_id', userId),
      currentUserId
        ? supabase.from('follows').select('id').eq('follower_id', currentUserId).eq('following_id', userId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    return {
      ...profile,
      followers_count: followersRes.count || 0,
      following_count: followingRes.count || 0,
      stickers_count: stickersRes.count || 0,
      is_following: !!isFollowingRes.data,
    } as Profile
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    // Use folder per user inside the bucket so storage RLS policies can validate by folder
    const filePath = `${userId}/${Date.now()}.${fileExt}`

    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  },

  async searchUsers(query: string, currentUserId?: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', currentUserId || '')
      .limit(20)

    if (error) throw error
    return data as Profile[]
  },

  async getFollowers(userId: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('follows')
      .select('follower:profiles!follower_id(*)')
      .eq('following_id', userId)

    if (error) throw error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data?.map((d: any) => d.follower) || []) as Profile[]
  },

  async getFollowing(userId: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('follows')
      .select('following:profiles!following_id(*)')
      .eq('follower_id', userId)

    if (error) throw error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data?.map((d: any) => d.following) || []) as Profile[]
  },

  async followUser(followerId: string, followingId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })

    if (error) throw error
  },

  async unfollowUser(followerId: string, followingId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (error) throw error
  },
}
