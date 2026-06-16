import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Message, Conversation } from '@/types'

export const messageService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*),
        receiver:profiles!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Group by conversation partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationMap = new Map<string, any>()

    for (const msg of (data || [])) {
      const partner = msg.sender_id === userId ? msg.receiver : msg.sender
      if (!partner) continue
      
      if (!conversationMap.has(partner.id)) {
        const unread = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('sender_id', partner.id)
          .eq('receiver_id', userId)
          .eq('read', false)

        conversationMap.set(partner.id, {
          partner,
          last_message: msg,
          unread_count: unread.count || 0,
        })
      }
    }

    return Array.from(conversationMap.values()) as Conversation[]
  },

  async getMessages(userId: string, partnerId: string): Promise<Message[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*),
        receiver:profiles!receiver_id(*)
      `)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', userId)
      .eq('read', false)

    return data as Message[]
  },

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, content, read: false })
      .select(`*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)`)
      .single()

    if (error) throw error
    return data as Message
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  },

  subscribeToMessages(userId: string, callback: (message: Message) => void) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis no .env e reinicie o servidor.')
    }
    const supabase = getSupabaseClient()
    return supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  },
}
