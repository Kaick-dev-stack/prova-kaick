import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus, UserMinus, MessageCircle, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import type { Profile } from '@/types'
import { profileService } from '@/services/profileService'
import { useAuthStore } from '@/store/authStore'

export default function SearchPage() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState<string | null>(null)
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([])

  useEffect(() => {
    loadSuggestedUsers()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch()
      } else if (query.trim().length === 0) {
        setResults([])
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  const loadSuggestedUsers = async () => {
    try {
      const users = await profileService.searchUsers('', user?.id)
      setSuggestedUsers(users.slice(0, 6))
    } catch {
      // ignore
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await profileService.searchUsers(query.trim(), user?.id)
      // Enrich with following status
      if (user) {
        const followingList = await profileService.getFollowing(user.id)
        const followingIds = new Set(followingList.map(f => f.id))
        setResults(data.map(p => ({ ...p, is_following: followingIds.has(p.id) })))
      } else {
        setResults(data)
      }
    } catch {
      toast.error('Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleFollowToggle = async (profile: Profile) => {
    if (!user) return
    setFollowLoading(profile.id)
    try {
      if (profile.is_following) {
        await profileService.unfollowUser(user.id, profile.id)
        setResults(prev => prev.map(p =>
          p.id === profile.id ? { ...p, is_following: false } : p
        ))
        setSuggestedUsers(prev => prev.map(p =>
          p.id === profile.id ? { ...p, is_following: false } : p
        ))
        toast.success(`Você deixou de seguir ${profile.username}`)
      } else {
        await profileService.followUser(user.id, profile.id)
        setResults(prev => prev.map(p =>
          p.id === profile.id ? { ...p, is_following: true } : p
        ))
        setSuggestedUsers(prev => prev.map(p =>
          p.id === profile.id ? { ...p, is_following: true } : p
        ))
        toast.success(`Agora você segue ${profile.username}!`)
      }
    } catch {
      toast.error('Erro ao atualizar seguimento')
    } finally {
      setFollowLoading(null)
    }
  }

  const displayList = query.trim().length >= 2 ? results : suggestedUsers

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Search className="w-6 h-6 text-[#009739]" />
          Buscar Colecionadores
        </h1>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome de usuário..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-11 text-base"
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#009739] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {query.trim().length >= 2 ? `Resultados para "${query}"` : 'Sugeridos para você'}
        </h2>

        {displayList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm text-center">
                {query.trim().length >= 2
                  ? 'Nenhum usuário encontrado'
                  : 'Nenhum usuário disponível'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {displayList.map(profile => (
              <div
                key={profile.id}
                className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
              >
                <Link to={`/profile/${profile.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-11 w-11 flex-shrink-0">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="font-semibold">
                      {profile.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{profile.username}</p>
                    {profile.bio && (
                      <p className="text-xs text-muted-foreground truncate">{profile.bio}</p>
                    )}
                    {profile.favorite_team && (
                      <p className="text-xs text-[#009739]">🏳️ {profile.favorite_team}</p>
                    )}
                  </div>
                </Link>
                <div className="flex gap-2 flex-shrink-0">
                  <Link to={`/messages/${profile.id}`}>
                    <Button size="icon" variant="outline" className="h-8 w-8">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant={profile.is_following ? 'outline' : 'default'}
                    className="h-8"
                    onClick={() => handleFollowToggle(profile)}
                    disabled={followLoading === profile.id}
                  >
                    {profile.is_following ? (
                      <><UserMinus className="w-3.5 h-3.5 mr-1" /> Seguindo</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5 mr-1" /> Seguir</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
