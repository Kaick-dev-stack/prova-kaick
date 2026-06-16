import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, MessageCircle, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Message, Conversation, Profile } from '@/types'
import { messageService } from '@/services/messageService'
import { profileService } from '@/services/profileService'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export default function MessagesPage() {
  const { userId: partnerId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [partner, setPartner] = useState<Profile | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) loadConversations()
  }, [user])

  useEffect(() => {
    if (user && partnerId) {
      loadMessages(partnerId)
    }
  }, [user, partnerId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!user) return
    const subscription = messageService.subscribeToMessages(user.id, (msg) => {
      if (partnerId && (msg.sender_id === partnerId || msg.receiver_id === partnerId)) {
        setMessages(prev => [...prev, msg])
      }
      loadConversations()
    })
    return () => { subscription.unsubscribe() }
  }, [user, partnerId])

  const loadConversations = async () => {
    if (!user) return
    try {
      const data = await messageService.getConversations(user.id)
      setConversations(data)
    } catch {
      toast.error('Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (pid: string) => {
    if (!user) return
    try {
      const [msgs, partnerProfile] = await Promise.all([
        messageService.getMessages(user.id, pid),
        profileService.getProfile(pid),
      ])
      setMessages(msgs)
      setPartner(partnerProfile)
    } catch {
      toast.error('Erro ao carregar mensagens')
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !partnerId) return
    setSending(true)
    try {
      const msg = await messageService.sendMessage(user.id, partnerId, newMessage.trim())
      setMessages(prev => [...prev, msg])
      setNewMessage('')
      loadConversations()
    } catch {
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.partner.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto px-0 sm:px-4 py-0 sm:py-6 pb-20 md:pb-6 h-[calc(100vh-56px)] sm:h-auto">
      <div className="flex h-full sm:h-[600px] border rounded-none sm:rounded-xl overflow-hidden bg-background">
        {/* Sidebar - Conversations */}
        <div className={cn(
          "w-full sm:w-80 border-r flex flex-col",
          partnerId && "hidden sm:flex"
        )}>
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#009739]" />
              Mensagens
            </h2>
            <div className="mt-2 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center p-4">
                <MessageCircle className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </p>
                <Link to="/search">
                  <Button size="sm" variant="outline">Encontrar Usuários</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map(conv => (
                  <button
                    key={conv.partner.id}
                    onClick={() => navigate(`/messages/${conv.partner.id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors text-left",
                      partnerId === conv.partner.id && "bg-accent"
                    )}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={conv.partner.avatar_url || ''} />
                      <AvatarFallback className="text-sm">
                        {conv.partner.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate">{conv.partner.username}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.last_message.sender_id === user?.id ? 'Você: ' : ''}
                        {conv.last_message.content}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge className="ml-1 h-5 w-5 flex-shrink-0 rounded-full p-0 flex items-center justify-center text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !partnerId && "hidden sm:flex"
        )}>
          {!partnerId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#009739]/10 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-[#009739]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Suas Mensagens</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Selecione uma conversa ou inicie uma nova
                </p>
              </div>
              <Link to="/search">
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Usuários
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  onClick={() => navigate('/messages')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                {partner ? (
                  <Link
                    to={`/profile/${partner.id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={partner.avatar_url || ''} />
                      <AvatarFallback className="text-sm">
                        {partner.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{partner.username}</p>
                      <p className="text-xs text-muted-foreground">Ver perfil</p>
                    </div>
                  </Link>
                ) : (
                  <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm">
                      Nenhuma mensagem ainda. Diga olá! 👋
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender_id === user?.id
                      const showDate = index === 0 ||
                        new Date(msg.created_at).toDateString() !==
                        new Date(messages[index - 1].created_at).toDateString()

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-3">
                              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                {new Date(msg.created_at).toLocaleDateString('pt-BR', {
                                  weekday: 'long', day: 'numeric', month: 'long'
                                })}
                              </span>
                            </div>
                          )}
                          <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                            {!isOwn && (
                              <Avatar className="h-6 w-6 flex-shrink-0 mt-1">
                                <AvatarImage src={msg.sender?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {msg.sender?.username?.slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn(
                              "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                              isOwn
                                ? "bg-[#009739] text-white rounded-tr-sm"
                                : "bg-muted rounded-tl-sm"
                            )}>
                              <p>{msg.content}</p>
                              <p className={cn(
                                "text-xs mt-1",
                                isOwn ? "text-white/70" : "text-muted-foreground"
                              )}>
                                {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                                {isOwn && (
                                  <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    className="flex-1"
                    maxLength={1000}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
