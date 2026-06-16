import { useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

export default function AuthLayout() {
  const location = useLocation()
  const { user, initialized } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#009739] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user && location.pathname !== '/reset-password') {
    return <Navigate to="/feed" replace />
  }

  return <Outlet />
}
