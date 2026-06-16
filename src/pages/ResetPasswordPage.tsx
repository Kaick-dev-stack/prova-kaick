import { useEffect, useState } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { Trophy, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/authService'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  const location = useLocation()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    // Also check URL hash (some Supabase flows return tokens in the hash)
    const hash = location.hash || ''
    const hashHasAccess = /access_token=/.test(hash)
    const hashHasRefresh = /refresh_token=/.test(hash)

    setHasToken(Boolean(accessToken || refreshToken || hashHasAccess || hashHasRefresh))
  }, [searchParams, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await authService.updatePassword(password)
      setSuccess(true)
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erro ao redefinir a senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#009739]/10 via-background to-[#FEDD00]/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#009739] mb-4 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FiguraCopa</h1>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Redefinir Senha</CardTitle>
            <CardDescription className="text-center">
              {success
                ? 'Senha redefinida com sucesso!'
                : hasToken
                  ? 'Digite uma nova senha para sua conta'
                  : 'Link de redefinição inválido ou expirado.'}
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-[#009739]" />
              <p className="text-center text-sm text-muted-foreground">
                Sua senha foi atualizada. Agora você pode entrar com a nova senha.
              </p>
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Voltar ao login
                </Button>
              </Link>
            </CardContent>
          ) : hasToken ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-10 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <p className="text-center text-sm text-muted-foreground">
                O link de redefinição parece inválido ou expirado. Solicite um novo link.
              </p>
              <Link to="/forgot-password" className="w-full">
                <Button variant="outline" className="w-full">
                  Solicitar novo link
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
