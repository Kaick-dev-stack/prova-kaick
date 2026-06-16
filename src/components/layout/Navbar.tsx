import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Trophy, Home, BookOpen, MessageCircle, Search, Moon, Sun, LogOut, User, Menu, X, Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/collection', icon: BookOpen, label: 'Coleção' },
  { to: '/messages', icon: MessageCircle, label: 'Mensagens' },
  { to: '/search', icon: Search, label: 'Buscar' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.username?.slice(0, 2).toUpperCase() || 'U'

  return (
    <>
      {/* Desktop Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-full bg-[#009739] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#009739] hidden sm:block">FiguraCopa</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-2',
                    location.pathname.startsWith(to) && 'text-[#009739] bg-[#009739]/10'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <div className="hidden sm:flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Add sticker button */}
            <Link to="/collection/new">
              <Button size="sm" className="hidden sm:flex gap-1">
                <Plus className="w-4 h-4" />
                <span className="hidden lg:block">Nova Figurinha</span>
              </Button>
            </Link>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#009739] focus:ring-offset-2">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{profile?.username}</span>
                    <span className="text-xs text-muted-foreground font-normal">Meu perfil</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/profile/${profile?.id}`)}>
                  <User className="w-4 h-4 mr-2" />
                  Ver Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                  <User className="w-4 h-4 mr-2" />
                  Editar Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/collection/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Figurinha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="sm:hidden flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm">Tema Escuro</span>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <button
              className="md:hidden p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background py-2">
            <nav className="flex flex-col">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors',
                    location.pathname.startsWith(to) && 'text-[#009739] bg-[#009739]/10'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
              <Link
                to="/collection/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[#009739] font-medium hover:bg-accent transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nova Figurinha
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t flex items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs',
              location.pathname.startsWith(to)
                ? 'text-[#009739]'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
        <Link
          to="/collection/new"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs text-muted-foreground"
        >
          <div className="w-8 h-8 rounded-full bg-[#009739] flex items-center justify-center -mt-4">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span>Novo</span>
        </Link>
        <Link
          to={`/profile/${profile?.id}`}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs',
            location.pathname.startsWith('/profile') && !location.pathname.includes('/edit')
              ? 'text-[#009739]'
              : 'text-muted-foreground'
          )}
        >
          <Bell className="w-5 h-5" />
          <span>Perfil</span>
        </Link>
      </nav>
    </>
  )
}
