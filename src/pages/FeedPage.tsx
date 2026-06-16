import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Users, Plus, Rss } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import StickerCard from '@/components/stickers/StickerCard'
import StickerForm from '@/components/stickers/StickerForm'
import type { Sticker } from '@/types'
import { stickerService } from '@/services/stickerService'
import { useAuthStore } from '@/store/authStore'

export default function FeedPage() {
  const { user } = useAuthStore()
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSticker, setEditSticker] = useState<Sticker | null>(null)

  useEffect(() => {
    if (user) loadFeed()
  }, [user])

  const loadFeed = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await stickerService.getFeedStickers(user.id)
      setStickers(data)
    } catch {
      toast.error('Erro ao carregar feed')
    } finally {
      setLoading(false)
    }
  }

  const handleStickerAdded = (sticker: Sticker) => {
    setStickers(prev => [sticker, ...prev])
    setEditSticker(null)
  }

  const handleStickerUpdate = (sticker: Sticker) => {
    setEditSticker(sticker)
    setShowForm(true)
  }

  const handleStickerDeleted = (stickerId: string) => {
    setStickers(prev => prev.filter(s => s.id !== stickerId))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rss className="w-6 h-6 text-[#009739]" />
            Feed
          </h1>
          <p className="text-sm text-muted-foreground">Figurinhas de quem você segue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadFeed} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => { setEditSticker(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:block">Nova</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : stickers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#009739]/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-[#009739]" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1">Seu feed está vazio</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Siga outros colecionadores para ver suas figurinhas aqui, ou adicione suas próprias!
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/search">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Encontrar Colecionadores
                </Button>
              </Link>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Figurinha
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stickers.map(sticker => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              onUpdate={handleStickerUpdate}
              onDelete={handleStickerDeleted}
            />
          ))}
        </div>
      )}

      {/* Sticker Form Modal */}
      <StickerForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditSticker(null) }}
        onSuccess={handleStickerAdded}
        editSticker={editSticker}
      />
    </div>
  )
}
