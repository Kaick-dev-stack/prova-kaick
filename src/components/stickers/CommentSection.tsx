import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Send, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { Comment } from '@/types'
import { stickerService } from '@/services/stickerService'

interface CommentSectionProps {
  stickerId: string
  currentUserId?: string
}

export default function CommentSection({ stickerId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [stickerId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await stickerService.getComments(stickerId)
      setComments(data)
    } catch {
      toast.error('Erro ao carregar comentários')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setSubmitting(true)
    try {
      const comment = await stickerService.addComment(currentUserId, stickerId, newComment.trim())
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch {
      toast.error('Erro ao comentar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await stickerService.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comentário removido')
    } catch {
      toast.error('Erro ao remover comentário')
    }
  }

  return (
    <div className="px-3 pb-3 border-t pt-3">
      <Separator className="mb-3" />

      {/* Comment list */}
      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-2">Carregando...</div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-2">Sem comentários ainda</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Link to={`/profile/${comment.user_id}`}>
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {comment.profiles?.username?.slice(0, 1).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 bg-muted rounded-lg px-3 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{comment.profiles?.username || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {currentUserId === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={500}
            className="h-8 text-sm"
          />
          <Button type="submit" size="icon" className="h-8 w-8 flex-shrink-0" disabled={submitting || !newComment.trim()}>
            <Send className="w-3 h-3" />
          </Button>
        </form>
      )}
    </div>
  )
}
