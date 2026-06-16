import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Save, ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { COUNTRIES } from '@/types'
import { profileService } from '@/services/profileService'
import { useAuthStore } from '@/store/authStore'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [favoriteTeam, setFavoriteTeam] = useState(profile?.favorite_team || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setRemoveAvatar(false)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (username.length < 3) {
      toast.error('Nome de usuário deve ter pelo menos 3 caracteres')
      return
    }

    setLoading(true)
    try {
      let avatarUrl = profile?.avatar_url

      if (removeAvatar) {
        avatarUrl = null
      } else if (avatarFile) {
        avatarUrl = await profileService.uploadAvatar(user.id, avatarFile)
      }

      const updated = await profileService.updateProfile(user.id, {
        username,
        bio: bio || null,
        favorite_team: favoriteTeam || null,
        avatar_url: avatarUrl,
      })

      setProfile(updated)
      toast.success('Perfil atualizado com sucesso!')
      navigate(`/profile/${user.id}`)
    } catch (error: unknown) {
      const err = error as Error
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        toast.error('Este nome de usuário já está em uso')
      } else {
        toast.error(err.message || 'Erro ao atualizar perfil')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentAvatar = removeAvatar ? null : (avatarPreview || profile?.avatar_url)
  const initials = username?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Perfil</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={currentAvatar || ''} />
                <AvatarFallback className="text-2xl font-bold bg-[#009739] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#009739] text-white flex items-center justify-center shadow-md hover:bg-[#007a2e] transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Alterar Foto
              </Button>
              {(currentAvatar) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover foto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sua foto de perfil será removida. Isso não pode ser desfeito.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemoveAvatar} className="bg-red-600 hover:bg-red-700">
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Nome de Usuário *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                maxLength={30}
                required
                placeholder="seu_usuario"
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e underscores
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                placeholder="Fale um pouco sobre você e sua coleção..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
            </div>

            <div className="space-y-1.5">
              <Label>Time Favorito</Label>
              <Select
                value={favoriteTeam}
                onValueChange={setFavoriteTeam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu time favorito..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">Nenhum</SelectItem>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
