export type StickerStatus = 'have' | 'want' | 'duplicate'
export type Position = 'goalkeeper' | 'defender' | 'fullback' | 'midfielder' | 'forward'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  favorite_team: string | null
  created_at: string
  updated_at: string
  followers_count?: number
  following_count?: number
  stickers_count?: number
  is_following?: boolean
}

export interface Sticker {
  id: string
  user_id: string
  athlete_name: string
  country: string
  position: Position
  shirt_number: number
  image_url: string | null
  status: StickerStatus
  description: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  sticker_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  sticker_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Conversation {
  partner: Profile
  last_message: Message
  unread_count: number
}

export const COUNTRIES = [
  'Estados Unidos', 'Canadá', 'México',
  'Brasil', 'Argentina', 'Inglaterra', 'França', 'Alemanha', 'Espanha', 'Portugal',
  'Bélgica', 'Holanda', 'Itália', 'Suíça', 'Croácia', 'Sérvia', 'Dinamarca',
  'Suécia', 'Noruega', 'Polônia', 'Turquia', 'Romênia', 'Áustria', 'Escócia',
  'País de Gales', 'República da Irlanda',
  'Marrocos', 'Senegal', 'Tunísia', 'Egito', 'Argélia', 'Nigéria', 'Gana',
  'Camarões', 'Costa do Marfim', 'Catar', 'Japão', 'Coreia do Sul', 'Austrália',
  'Irã', 'Arábia Saudita', 'Emirados Árabes Unidos', 'Nova Zelândia',
  'Equador', 'Colômbia', 'Uruguai', 'Chile', 'Peru', 'Paraguai', 'Bolívia',
  'Venezuela', 'Costa Rica', 'Panamá', 'Jamaica', 'Honduras', 'Outro'
]

export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'goalkeeper', label: 'Goleiro' },
  { value: 'defender', label: 'Zagueiro' },
  { value: 'fullback', label: 'Lateral' },
  { value: 'midfielder', label: 'Meia' },
  { value: 'forward', label: 'Atacante' },
]

export const STATUS_LABELS: Record<StickerStatus, string> = {
  have: 'Tenho',
  want: 'Quero',
  duplicate: 'Repetida',
}
