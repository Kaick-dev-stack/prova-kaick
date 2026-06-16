import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Edit, UserPlus, UserMinus, MessageCircle, BookOpen, Users, Star, Trophy, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import StickerCard from '@/components/stickers/StickerCard'
import type { Profile, Sticker } from '@/types'
import { profileService } from '@/services/profileService'
import { stickerService } from '@/services/stickerService'
import { useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [followers, setFollowers] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const targetUserId = userId || user?.id
  const isOwnProfile = !userId || userId === user?.id

  useEffect(() => {
    if (targetUserId) {
      loadProfile()
    }
  }, [targetUserId])

  useEffect(() => {
    if (targetUserId) {
      loadStickers()
    }
  }, [targetUserId, activeTab])

  const loadProfile = async () => {
    if (!targetUserId) return
    setLoading(true)
    try {
      const [profileData, followersData, followingData] = await Promise.all([
        profileService.getProfileWithStats(targetUserId, user?.id),
        profileService.getFollowers(targetUserId),
        profileService.getFollowing(targetUserId),
      ])
      setProfile(profileData)
      setFollowers(followersData)
      setFollowing(followingData)
    } catch {
      toast.error('Erro ao carregar perfil')
      navigate('/feed')
    } finally {
      setLoading(false)
    }
  }

  const loadStickers = async () => {
    if (!targetUserId) return
    try {
      const status = activeTab === 'all' ? undefined : activeTab as 'have' | 'want' | 'duplicate'
      const data = await stickerService.getUserStickers(targetUserId, user?.id, status)
      setStickers(data)
    } catch {
      toast.error('Erro ao carregar figurinhas')
    }
  }

  const handleFollow = async () => {
    if (!user || !profile) return
    setFollowLoading(true)
    try {
      if (profile.is_following) {
        await profileService.unfollowUser(user.id, profile.id)
        setProfile(prev => prev ? {
          ...prev,
          is_following: false,
          followers_count: (prev.followers_count || 0) - 1,
        } : null)
        toast.success(`Você deixou de seguir ${profile.username}`)
      } else {
        await profileService.followUser(user.id, profile.id)
        setProfile(prev => prev ? {
          ...prev,
          is_following: true,
          followers_count: (prev.followers_count || 0) + 1,
        } : null)
        toast.success(`Agora você segue ${profile.username}!`)
      }
    } catch {
      toast.error('Erro ao atualizar seguimento')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleStickerDeleted = (stickerId: string) => {
    setStickers(prev => prev.filter(s => s.id !== stickerId))
    setProfile(prev => prev ? { ...prev, stickers_count: (prev.stickers_count || 0) - 1 } : null)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-[#009739] via-[#007a2e] to-[#FEDD00]" />

        <CardContent className="pt-0 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end -mt-10">
            {/* Avatar */}
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback className="text-2xl font-bold bg-[#009739] text-white">
                {profile.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold">{profile.username}</h1>
                  {profile.favorite_team && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Flag className="w-3 h-3" />
                      <span>{profile.favorite_team}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Link to="/profile/edit">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Perfil
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant={profile.is_following ? 'outline' : 'default'}
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {profile.is_following ? (
                          <><UserMinus className="w-4 h-4 mr-1" /> Seguindo</>
                        ) : (
                          <><UserPlus className="w-4 h-4 mr-1" /> Seguir</>
                        )}
                      </Button>
                      <Link to={`/messages/${profile.id}`}>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="w-4 h-4 mr-1" /> Mensagem
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-4 mt-3">
                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowers(true)}
                >
                  <p className="font-bold text-sm">{profile.followers_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </button>
                <Separator orientation="vertical" className="h-8" />
                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowing(true)}
                >
                  <p className="font-bold text-sm">{profile.following_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Seguindo</p>
                </button>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <p className="font-bold text-sm">{profile.stickers_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Figurinhas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Summary Badges */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {stickers.filter(s => s.status === 'have').length > 0 && (
              <Badge variant="have">
                ✅ {stickers.filter(s => s.status === 'have').length} Tenho
              </Badge>
            )}
            {stickers.filter(s => s.status === 'want').length > 0 && (
              <Badge variant="want">
                ❤️ {stickers.filter(s => s.status === 'want').length} Quero
              </Badge>
            )}
            {stickers.filter(s => s.status === 'duplicate').length > 0 && (
              <Badge variant="duplicate">
                🔄 {stickers.filter(s => s.status === 'duplicate').length} Repetidas
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#009739]" />
            Coleção
          </h2>
          {isOwnProfile && (
            <Link to="/collection">
              <Button variant="outline" size="sm">Ver Coleção Completa</Button>
            </Link>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="have">Tenho</TabsTrigger>
            <TabsTrigger value="want">Quero</TabsTrigger>
            <TabsTrigger value="duplicate">Repetidas</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            {stickers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <Star className="w-10 h-10 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Nenhuma figurinha encontrada</p>
                  {isOwnProfile && (
                    <Link to="/collection">
                      <Button size="sm">
                        <Trophy className="w-4 h-4 mr-2" />
                        Adicionar Figurinha
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {stickers.map(sticker => (
                  <StickerCard
                    key={sticker.id}
                    sticker={sticker}
                    onDelete={isOwnProfile ? handleStickerDeleted : undefined}
                    showActions={isOwnProfile}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Followers Modal */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Seguidores ({profile.followers_count || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {followers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum seguidor ainda</p>
            ) : followers.map(f => (
              <Link
                key={f.id}
                to={`/profile/${f.id}`}
                onClick={() => setShowFollowers(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={f.avatar_url || ''} />
                  <AvatarFallback>{f.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{f.username}</span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Seguindo ({profile.following_count || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {following.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Não segue ninguém ainda</p>
            ) : following.map(f => (
              <Link
                key={f.id}
                to={`/profile/${f.id}`}
                onClick={() => setShowFollowing(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={f.avatar_url || ''} />
                  <AvatarFallback>{f.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{f.username}</span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
