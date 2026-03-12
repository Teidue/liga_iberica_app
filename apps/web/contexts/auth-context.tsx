'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export type UserRole = 'SUPER_ADMIN' | 'TEAM_ADMIN'

export interface AuthUser {
  id: string
  nombre: string
  email: string
  rol: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token')
      const userRaw = localStorage.getItem('auth_user')
      if (token && userRaw) {
        const parsed = JSON.parse(userRaw) as AuthUser
        setUser(parsed)
      }
    } catch {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  function login(token: string, authUser: AuthUser) {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(authUser))
    document.cookie = `auth_token=${token}; path=/; SameSite=Strict; max-age=604800`
    document.cookie = `auth_role=${authUser.rol}; path=/; SameSite=Strict; max-age=604800`
    setUser(authUser)
  }

  function logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    document.cookie = 'auth_token=; path=/; SameSite=Strict; max-age=0'
    document.cookie = 'auth_role=; path=/; SameSite=Strict; max-age=0'
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
