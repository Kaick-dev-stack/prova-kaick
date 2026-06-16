import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, BookOpen, Star, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StickerCard from '@/components/stickers/StickerCard'
import StickerForm from '@/components/stickers/StickerForm'
import type { Profile, Sticker, StickerStatus } from '@/types'
import { stickerService } from '@/services/stickerService'
import { profileService } from '@/services/profileService'
import { useAuthStore } from '@/store/authStore'

export default function CollectionPage() {
  const { user } = useAuthStore()
  const { userId } = useParams<{ userId?: string }>()
  const targetUserId = userId || user?.id
  const isOwnCollection = !userId || userId === user?.id

  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editSticker, setEditSticker] = useState<Sticker | null>(null)

  useEffect(() => {
    if (targetUserId) {
      loadCollection()
      if (!isOwnCollection) {
        loadOwnerProfile()
      } else {
        setOwnerProfile(null)
      }
    }
  }, [targetUserId, user?.id, isOwnCollection])

  const loadOwnerProfile = async () => {
    if (!targetUserId) return
    try {
      const profile = await profileService.getProfile(targetUserId)
      setOwnerProfile(profile)
    } catch {
      toast.error('Erro ao carregar perfil do usuário')
      setOwnerProfile(null)
    }
  }

  const loadCollection = async () => {
    if (!targetUserId) return
    setLoading(true)
    try {
      const data = await stickerService.getUserStickers(targetUserId, user?.id)
      setStickers(data)
    } catch {
      toast.error('Erro ao carregar coleção')
    } finally {
      setLoading(false)
    }
  }

  const handleStickerSuccess = (sticker: Sticker) => {
    if (editSticker) {
      setStickers(prev => prev.map(s => s.id === sticker.id ? sticker : s))
    } else {
      setStickers(prev => [sticker, ...prev])
    }
    setEditSticker(null)
  }

  const handleEdit = (sticker: Sticker) => {
    setEditSticker(sticker)
    setShowForm(true)
  }

  const handleDelete = (stickerId: string) => {
    setStickers(prev => prev.filter(s => s.id !== stickerId))
  }

  const filteredStickers = activeTab === 'all'
    ? stickers
    : stickers.filter(s => s.status === activeTab as StickerStatus)

  const stats = {
    total: stickers.length,
    have: stickers.filter(s => s.status === 'have').length,
    want: stickers.filter(s => s.status === 'want').length,
    duplicate: stickers.filter(s => s.status === 'duplicate').length,
  }

  const pageTitle = isOwnCollection
    ? 'Minha Coleção'
    : ownerProfile?.username
      ? `Coleção de ${ownerProfile.username}`
      : 'Coleção do usuário'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#009739]" />
            {pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{stats.total} figurinhas no total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isOwnCollection && (
            <Link to={ownerProfile ? `/profile/${ownerProfile.id}` : '/profile'}>
              <Button variant="outline" size="sm">
                <Trophy className="w-4 h-4 mr-2" /> Ver Perfil
              </Button>
            </Link>
          )}
          {isOwnCollection && (
            <Button onClick={() => { setEditSticker(null); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Figurinha
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-l-4 border-l-gray-300">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.have}</p>
            <p className="text-xs text-muted-foreground mt-1">Tenho</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.want}</p>
            <p className="text-xs text-muted-foreground mt-1">Quero</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-orange-600">{stats.duplicate}</p>
            <p className="text-xs text-muted-foreground mt-1">Repetidas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">
              Todas
              <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="have">
              Tenho
              <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">{stats.have}</Badge>
            </TabsTrigger>
            <TabsTrigger value="want">
              Quero
              <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">{stats.want}</Badge>
            </TabsTrigger>
            <TabsTrigger value="duplicate">
              Repetidas
              <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">{stats.duplicate}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredStickers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-[#009739]/10 flex items-center justify-center">
                  <Star className="w-8 h-8 text-[#009739]" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">
                    {activeTab === 'all'
                      ? isOwnCollection
                        ? 'Sua coleção está vazia'
                        : 'Nenhuma figurinha encontrada'
                      : `Nenhuma figurinha com status "${activeTab === 'have' ? 'Tenho' : activeTab === 'want' ? 'Quero' : 'Repetida'}"`}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {activeTab === 'all'
                      ? isOwnCollection
                        ? 'Comece adicionando sua primeira figurinha!'
                        : 'Este colecionador ainda não adicionou figurinhas.'
                      : 'Tente outro filtro ou volte mais tarde.'}
                  </p>
                </div>
                {isOwnCollection && activeTab === 'all' && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Figurinha
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredStickers.map((sticker) => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
                  onUpdate={isOwnCollection ? handleEdit : undefined}
                  onDelete={isOwnCollection ? handleDelete : undefined}
                  showActions={isOwnCollection}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isOwnCollection && (
        <StickerForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditSticker(null) }}
          onSuccess={handleStickerSuccess}
          editSticker={editSticker}
        />
      )}
    </div>
  )
}
