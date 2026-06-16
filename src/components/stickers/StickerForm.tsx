import { useState, useEffect } from 'react'
import { Upload, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Sticker, StickerStatus, Position } from '@/types'
import { COUNTRIES, POSITIONS } from '@/types'
import { stickerService } from '@/services/stickerService'
import { useAuthStore } from '@/store/authStore'

interface StickerFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (sticker: Sticker) => void
  editSticker?: Sticker | null
}

export default function StickerForm({ open, onClose, onSuccess, editSticker }: StickerFormProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [diagnosticsText, setDiagnosticsText] = useState<string | null>(null)

  const [form, setForm] = useState({
    athlete_name: editSticker?.athlete_name || '',
    country: editSticker?.country || '',
    position: editSticker?.position || '' as Position,
    shirt_number: editSticker?.shirt_number?.toString() || '',
    image_url: editSticker?.image_url || '',
    status: editSticker?.status || 'have' as StickerStatus,
    description: editSticker?.description || '',
  })

  const resetForm = () => {
    setForm({
      athlete_name: '',
      country: '',
      position: '' as Position,
      shirt_number: '',
      image_url: '',
      status: 'have',
      description: '',
    })
    setImageMode('url')
    setImageFile(null)
    setErrorMessage(null)
  }

  useEffect(() => {
    if (!open) return

    if (editSticker) {
      setForm({
        athlete_name: editSticker.athlete_name,
        country: editSticker.country,
        position: editSticker.position,
        shirt_number: editSticker.shirt_number.toString(),
        image_url: editSticker.image_url || '',
        status: editSticker.status,
        description: editSticker.description || '',
      })
      setImageMode('url')
      setImageFile(null)
      setErrorMessage(null)
    } else {
      resetForm()
    }
  }, [editSticker, open])

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Você precisa estar logado para adicionar uma figurinha')
      return
    }
    if (!form.athlete_name || !form.country || !form.position || !form.shirt_number || !form.status) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const shirtNum = parseInt(form.shirt_number)
    if (isNaN(shirtNum) || shirtNum < 1 || shirtNum > 99) {
      toast.error('Número da camisa deve ser entre 1 e 99')
      return
    }

    if (imageMode === 'upload' && !imageFile) {
      toast.error('Selecione uma imagem para upload')
      return
    }

    setErrorMessage(null)
    setLoading(true)
    try {
      let imageUrl = form.image_url

      if (imageMode === 'upload' && imageFile) {
        imageUrl = await stickerService.uploadStickerImage(user.id, imageFile)
      }

      const stickerData = {
        user_id: user.id,
        athlete_name: form.athlete_name,
        country: form.country,
        position: form.position as Position,
        shirt_number: shirtNum,
        image_url: imageUrl || null,
        status: form.status as StickerStatus,
        description: form.description || null,
      }

      // Diagnostic logs to help trace RLS/auth issues
      console.debug('StickerForm submit: user from store', { user })
      console.debug('StickerForm submit: form', { form })
      console.debug('StickerForm submit: stickerData', { stickerData })

      let result: Sticker
      if (editSticker) {
        result = await stickerService.updateSticker(editSticker.id, stickerData)
        toast.success('Figurinha atualizada!')
      } else {
        result = await stickerService.createSticker(stickerData)
        toast.success('Figurinha adicionada à sua coleção!')
      }

      onSuccess(result)
      onClose()
      resetForm()
    } catch (error: unknown) {
      const err = error as Error
      setErrorMessage(err.message || 'Erro ao salvar figurinha')
      console.error('StickerForm submit error:', err)
      toast.error(err.message || 'Erro ao salvar figurinha')
    } finally {
      setLoading(false)
    }
  }

  const sendDiagnostics = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para coletar diagnóstico')
      return
    }

    const shirtNum = parseInt(form.shirt_number) || null
    const stickerData = {
      user_id: user.id,
      athlete_name: form.athlete_name,
      country: form.country,
      position: form.position as Position,
      shirt_number: shirtNum,
      image_url: form.image_url || null,
      status: form.status as StickerStatus,
      description: form.description || null,
    }

    try {
      const diag = await stickerService.getDiagnostics(user.id, stickerData)
      const text = JSON.stringify(diag, null, 2)
      console.debug('Sticker diagnostics:', diag)
      setDiagnosticsText(text)
      toast.success('Diagnóstico pronto abaixo — copie e cole aqui')
    } catch (err) {
      console.error('Erro ao coletar diagnóstico', err)
      toast.error('Falha ao coletar diagnóstico')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editSticker ? 'Editar Figurinha' : 'Nova Figurinha'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {/* Athlete Name */}
          <div className="space-y-1.5">
            <Label htmlFor="athlete_name">Nome do Atleta *</Label>
            <Input
              id="athlete_name"
              placeholder="Ex: Cristiano Ronaldo"
              value={form.athlete_name ?? ''}
              onChange={(e) => updateForm('athlete_name', e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {/* Country & Position Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>País/Seleção *</Label>
              <Select value={form.country} onValueChange={(v) => updateForm('country', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Posição *</Label>
              <Select value={form.position} onValueChange={(v) => updateForm('position', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shirt Number & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shirt_number">Número da Camisa *</Label>
              <Input
                id="shirt_number"
                type="number"
                placeholder="1-99"
                value={form.shirt_number ?? ''}
                onChange={(e) => updateForm('shirt_number', e.target.value)}
                min={1}
                max={99}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => updateForm('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="have">✅ Tenho</SelectItem>
                  <SelectItem value="want">❤️ Quero</SelectItem>
                  <SelectItem value="duplicate">🔄 Repetida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label>Imagem</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant={imageMode === 'url' ? 'default' : 'outline'}
                onClick={() => {
                  setImageMode('url')
                  setImageFile(null)
                }}
              >
                <Link2 className="w-3 h-3 mr-1" /> URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant={imageMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setImageMode('upload')}
              >
                <Upload className="w-3 h-3 mr-1" /> Upload
              </Button>
            </div>
            {imageMode === 'url' ? (
              <Input
                placeholder="https://exemplo.com/imagem.jpg"
                value={form.image_url}
                onChange={(e) => updateForm('image_url', e.target.value)}
              />
            ) : (
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            )}
            {/* Preview */}
            {(form.image_url || imageFile) && (
              <div className="mt-2 rounded-lg overflow-hidden h-32 bg-muted">
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : form.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Adicione uma descrição sobre o atleta ou a figurinha..."
                value={form.description ?? ''}
              onChange={(e) => updateForm('description', e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{(form.description ?? '').length}/500</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="button" variant="ghost" onClick={sendDiagnostics} disabled={loading}>
              Enviar diagnóstico
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editSticker ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
          {diagnosticsText && (
            <div className="p-3 bg-muted rounded-md mt-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">Diagnóstico</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(diagnosticsText); toast.success('Copiado') }}>
                    Copiar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDiagnosticsText(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
              <textarea readOnly className="w-full h-40 p-2 text-xs font-mono bg-transparent text-foreground" value={diagnosticsText}></textarea>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
