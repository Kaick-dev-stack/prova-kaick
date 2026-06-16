import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Sticker, StickerStatus, Comment } from '@/types'

const getSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
  }
  return getSupabaseClient()
}

export const stickerService = {
  async getFeedStickers(userId: string): Promise<Sticker[]> {
    const supabase = getSupabase()

    // Get IDs of users being followed
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    const followingIds = followData?.map((f) => f.following_id) || []
    followingIds.push(userId) // Include own stickers

    if (followingIds.length === 0) return []

    const { data, error } = await supabase
      .from('stickers')
      .select(`
        *,
        profiles:user_id(*)
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const stickers = await Promise.all(
      (data || []).map(async (sticker) => {
        const [likesRes, commentsRes, isLikedRes] = await Promise.all([
          supabase.from('likes').select('id', { count: 'exact' }).eq('sticker_id', sticker.id),
          supabase.from('comments').select('id', { count: 'exact' }).eq('sticker_id', sticker.id),
          supabase.from('likes').select('id').eq('sticker_id', sticker.id).eq('user_id', userId).maybeSingle(),
        ])
        return {
          ...sticker,
          likes_count: likesRes.count || 0,
          comments_count: commentsRes.count || 0,
          is_liked: !!isLikedRes.data,
        }
      })
    )

    return stickers as Sticker[]
  },

  async getUserStickers(userId: string, currentUserId?: string, status?: StickerStatus): Promise<Sticker[]> {
    const supabase = getSupabase()

    let query = supabase
      .from('stickers')
      .select(`*, profiles:user_id(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    if (!currentUserId) return data as Sticker[]

    const stickers = await Promise.all(
      (data || []).map(async (sticker) => {
        const [likesRes, commentsRes, isLikedRes] = await Promise.all([
          supabase.from('likes').select('id', { count: 'exact' }).eq('sticker_id', sticker.id),
          supabase.from('comments').select('id', { count: 'exact' }).eq('sticker_id', sticker.id),
          supabase.from('likes').select('id').eq('sticker_id', sticker.id).eq('user_id', currentUserId).maybeSingle(),
        ])
        return {
          ...sticker,
          likes_count: likesRes.count || 0,
          comments_count: commentsRes.count || 0,
          is_liked: !!isLikedRes.data,
        }
      })
    )

    return stickers as Sticker[]
  },

  async getSticker(stickerId: string): Promise<Sticker> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('stickers')
      .select(`*, profiles:user_id(*)`)
      .eq('id', stickerId)
      .single()

    if (error) throw error
    return data as Sticker
  },

  async createSticker(sticker: Omit<Sticker, 'id' | 'created_at' | 'updated_at' | 'profiles'>) {
    const supabase = getSupabase()
    // Ensure there's an active authenticated session and it matches the provided user_id
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.debug('createSticker: no active session', { sticker })
      throw new Error('Usuário não autenticado. Faça login antes de adicionar uma figurinha.')
    }
    if (session.user.id !== sticker.user_id) {
      console.debug('createSticker: session/user mismatch', { sessionUserId: session.user.id, stickerUserId: sticker.user_id, sticker })
      throw new Error('Sessão de autenticação não corresponde ao usuário informado. Faça login novamente.')
    }

    // Additional session/user introspection for debugging
    try {
      const userResp = await supabase.auth.getUser()
      console.debug('createSticker: supabase.auth.getUser()', { userResp: userResp.data?.user ? { id: userResp.data.user.id } : null })
    } catch (e) {
      console.debug('createSticker: failed to getUser()', { e })
    }

    console.debug('createSticker: inserting sticker', { sessionUserId: session.user.id, sticker })
    const { data, error } = await supabase
      .from('stickers')
      .insert(sticker)
      .select(`*, profiles:user_id(*)`)
      .single()

    if (error) {
      console.debug('createSticker: supabase insert error', { error })
      throw error
    }
    return data as Sticker
  },

  async updateSticker(stickerId: string, updates: Partial<Sticker>) {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('stickers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', stickerId)
      .select(`*, profiles:user_id(*)`)
      .single()

    if (error) throw error
    return data as Sticker
  },

  async deleteSticker(stickerId: string) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('stickers')
      .delete()
      .eq('id', stickerId)

    if (error) throw error
  },

  async uploadStickerImage(userId: string, file: File): Promise<string> {
    const supabase = getSupabase()

    if (!file.name) {
      throw new Error('Arquivo de imagem inválido')
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    // The bucket is already `stickers` — object `name` should be relative to the bucket root.
    const filePath = `${userId}/${Date.now()}.${fileExt}`

    // Verify session user matches folder user to satisfy storage RLS policy
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.debug('uploadStickerImage: no active session', { userId, filePath })
      throw new Error('Usuário não autenticado. Faça login antes de enviar imagens.')
    }
    if (session.user.id !== userId) {
      console.debug('uploadStickerImage: session/user mismatch', { sessionUserId: session.user.id, userId, filePath })
      throw new Error('Sessão de autenticação não corresponde ao usuário informado. Faça login novamente.')
    }

    console.debug('uploadStickerImage: uploading', { sessionUserId: session.user.id, userId, filePath })
    const { error: uploadError } = await supabase.storage
      .from('stickers')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('stickers').getPublicUrl(filePath)
    if (!data?.publicUrl) {
      throw new Error('Não foi possível obter a URL da imagem')
    }

    return data.publicUrl
  },

  async likeSticker(userId: string, stickerId: string) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userId, sticker_id: stickerId })

    if (error) throw error
  },

  async unlikeSticker(userId: string, stickerId: string) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('sticker_id', stickerId)

    if (error) throw error
  },

  async getComments(stickerId: string): Promise<Comment[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('comments')
      .select(`*, profiles:user_id(*)`)
      .eq('sticker_id', stickerId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Comment[]
  },

  async addComment(userId: string, stickerId: string, content: string): Promise<Comment> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: userId, sticker_id: stickerId, content })
      .select(`*, profiles:user_id(*)`)
      .single()

    if (error) throw error
    return data as Comment
  },

  async deleteComment(commentId: string) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
  },

  async getDiagnostics(userId: string, sticker?: Partial<Sticker>) {
    const supabase = getSupabase()
    const diagnostics: any = { timestamp: new Date().toISOString() }

    try {
      const sessionResp = await supabase.auth.getSession()
      diagnostics.session = sessionResp.data?.session ?? null
    } catch (e) {
      diagnostics.sessionError = String(e)
    }

    try {
      const userResp = await supabase.auth.getUser()
      diagnostics.user = userResp.data?.user ?? null
    } catch (e) {
      diagnostics.userError = String(e)
    }

    diagnostics.clientUserId = userId
    diagnostics.sticker = sticker ?? null

    return diagnostics
  },
}
