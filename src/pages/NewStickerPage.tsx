import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StickerForm from '@/components/stickers/StickerForm'
import type { Sticker } from '@/types'
import { useAuthStore } from '@/store/authStore'

export default function NewStickerPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [createdSticker, setCreatedSticker] = useState<Sticker | null>(null)

  const handleSuccess = (sticker: Sticker) => {
    setCreatedSticker(sticker)
    toast.success('Figurinha adicionada à sua coleção!')
    navigate('/collection')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Adicionar Figurinha</h1>
          <p className="text-sm text-muted-foreground">Adicione uma nova figurinha à sua coleção pessoal.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nova Figurinha</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <StickerForm
              open={true}
              onClose={() => navigate('/collection')}
              onSuccess={handleSuccess}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Você precisa estar logado para adicionar figurinhas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
