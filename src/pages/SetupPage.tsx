import { useState } from 'react'
import { Trophy, Database, Key, ArrowRight, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const SQL_PREVIEW = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  favorite_team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ... (see supabase/schema.sql for full schema)`

export default function SetupPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [step, setStep] = useState(1)

  const steps = [
    {
      id: 1,
      title: 'Criar Projeto no Supabase',
      description: 'Acesse supabase.com e crie um novo projeto gratuito',
      icon: Database,
    },
    {
      id: 2,
      title: 'Executar Schema SQL',
      description: 'Execute o arquivo supabase/schema.sql no SQL Editor do Supabase',
      icon: Database,
    },
    {
      id: 3,
      title: 'Configurar Variáveis',
      description: 'Adicione as credenciais do Supabase',
      icon: Key,
    },
  ]

  const handleCopyEnv = () => {
    const envContent = `VITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_ANON_KEY=${supabaseKey}`
    navigator.clipboard.writeText(envContent)
    toast.success('Copiado! Cole em um arquivo .env na raiz do projeto')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#009739]/10 via-background to-[#FEDD00]/10 p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#009739] mb-4 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">FiguraCopa</h1>
          <p className="text-muted-foreground mt-2">
            Configure o Supabase para começar a usar a aplicação
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((s) => (
            <Card
              key={s.id}
              className={`cursor-pointer transition-all ${step === s.id ? 'border-[#009739] shadow-md' : 'hover:border-[#009739]/50'}`}
              onClick={() => setStep(s.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.id ? 'bg-[#009739] text-white' : 'bg-muted text-muted-foreground'}`}>
                    {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                  </div>
                  <div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <CardDescription className="text-sm">{s.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              {step === s.id && (
                <CardContent>
                  {s.id === 1 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        1. Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#009739] underline">supabase.com</a> e crie uma conta gratuita
                      </p>
                      <p className="text-sm text-muted-foreground">
                        2. Clique em "New Project" e preencha as informações
                      </p>
                      <p className="text-sm text-muted-foreground">
                        3. Aguarde o projeto ser criado (pode levar alguns minutos)
                      </p>
                      <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                        <Button className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Acessar Supabase Dashboard
                        </Button>
                      </a>
                      <Button variant="outline" onClick={() => setStep(2)} className="ml-2">
                        Próximo <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}

                  {s.id === 2 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No seu projeto Supabase, vá em <strong>SQL Editor</strong> e execute o conteúdo do arquivo <code className="bg-muted px-1 rounded">supabase/schema.sql</code>
                      </p>
                      <div className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                        <pre>{SQL_PREVIEW}</pre>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="have">✅ Tabelas criadas</Badge>
                        <Badge variant="want">🔒 RLS configurado</Badge>
                        <Badge variant="duplicate">📦 Storage configurado</Badge>
                      </div>
                      <Button variant="outline" onClick={() => setStep(3)}>
                        Próximo <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}

                  {s.id === 3 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Vá em <strong>Project Settings → API</strong> no Supabase Dashboard e copie as credenciais:
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Project URL</Label>
                          <Input
                            placeholder="https://xxxxxxxxxxxx.supabase.co"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Anon/Public Key</Label>
                          <Input
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                          />
                        </div>
                      </div>

                      {supabaseUrl && supabaseKey && (
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-xs font-semibold mb-1">Crie um arquivo <code>.env</code> na raiz:</p>
                          <pre className="text-xs font-mono text-muted-foreground">
{`VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}`}
                          </pre>
                          <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={handleCopyEnv}>
                            <Copy className="w-3 h-3" />
                            Copiar .env
                          </Button>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Após criar o arquivo .env, reinicie o servidor de desenvolvimento.
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 O que você vai ter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                '🔐 Autenticação completa',
                '👤 Perfis editáveis',
                '🃏 Coleção de figurinhas',
                '📱 Feed social',
                '❤️ Curtidas e comentários',
                '👥 Sistema de seguidores',
                '💬 Chat em tempo real',
                '🔍 Busca de usuários',
                '🌙 Modo escuro',
              ].map(f => (
                <div key={f} className="text-sm bg-muted rounded-lg px-3 py-2">
                  {f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
