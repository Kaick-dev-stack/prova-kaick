import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, MoreVertical, Trash2, Edit, Flag, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Sticker } from '@/types'
import { STATUS_LABELS, POSITIONS } from '@/types'
import { stickerService } from '@/services/stickerService'
import { useAuthStore } from '@/store/authStore'
import CommentSection from './CommentSection'

interface StickerCardProps {
  sticker: Sticker
  onUpdate?: (sticker: Sticker) => void
  onDelete?: (stickerId: string) => void
  showActions?: boolean
}

const statusVariants: Record<string, 'have' | 'want' | 'duplicate'> = {
  have: 'have',
  want: 'want',
  duplicate: 'duplicate',
}

const positionColors: Record<string, string> = {
  goalkeeper: 'bg-yellow-400',
  defender: 'bg-blue-500',
  fullback: 'bg-teal-500',
  midfielder: 'bg-purple-500',
  forward: 'bg-red-500',
}

export default function StickerCard({ sticker, onUpdate, onDelete, showActions = true }: StickerCardProps) {
  const { user } = useAuthStore()
  const [isLiked, setIsLiked] = useState(sticker.is_liked || false)
  const [likesCount, setLikesCount] = useState(sticker.likes_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  const isOwner = user?.id === sticker.user_id
  const positionLabel = POSITIONS.find(p => p.value === sticker.position)?.label || sticker.position

  const handleLike = async () => {
    if (!user) return
    setLikeLoading(true)
    try {
      if (isLiked) {
        await stickerService.unlikeSticker(user.id, sticker.id)
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        await stickerService.likeSticker(user.id, sticker.id)
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch {
      toast.error('Erro ao curtir figurinha')
    } finally {
      setLikeLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja remover esta figurinha?')) return
    try {
      await stickerService.deleteSticker(sticker.id)
      toast.success('Figurinha removida!')
      onDelete?.(sticker.id)
    } catch {
      toast.error('Erro ao remover figurinha')
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <Link
          to={`/profile/${sticker.user_id}`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={sticker.profiles?.avatar_url || ''} />
            <AvatarFallback className="text-xs">
              {sticker.profiles?.username?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight">{sticker.profiles?.username || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(sticker.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[sticker.status] as 'have' | 'want' | 'duplicate'}>
            {STATUS_LABELS[sticker.status]}
          </Badge>
          {showActions && isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdate?.(sticker)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Sticker Card Visual */}
      <div className="px-3 pb-2">
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#009739] to-[#005c22] min-h-[200px] flex">
          {/* Country flag/gradient background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Player image */}
          {sticker.image_url ? (
            <img
              src={sticker.image_url}
              alt={sticker.athlete_name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-10 h-10 text-[#FEDD00]" />
              </div>
            </div>
          )}

          {/* Shirt number badge */}
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#FEDD00] flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900">{sticker.shirt_number}</span>
          </div>

          {/* Position badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${positionColors[sticker.position] || 'bg-gray-500'}`}>
              {positionLabel}
            </span>
          </div>

          {/* Player info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="font-bold text-base leading-tight">{sticker.athlete_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Flag className="w-3 h-3" />
              <p className="text-xs opacity-90">{sticker.country}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {sticker.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sticker.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={likeLoading || !user}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Heart
              className={`w-4 h-4 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : ''}`}
            />
            <span>{likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#009739] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{sticker.comments_count || 0}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          stickerId={sticker.id}
          currentUserId={user?.id}
        />
      )}
    </Card>
  )
}
