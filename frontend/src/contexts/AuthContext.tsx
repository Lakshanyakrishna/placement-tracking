import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User } from '@/types/auth'
import * as authApi from '@/api/auth.api'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ mustChangePassword: boolean }>
  logout: () => Promise<void>
  clearMustChangePassword: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_STORAGE_KEY = 'auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // React StrictMode double-invokes effects in development (mount -> cleanup ->
    // remount, all synchronous). authApi.refresh() is itself single-flight (see
    // refreshAccessToken() in api/client.ts), so both invocations here share the
    // same underlying request and agree on the same outcome — this `ignore` flag
    // is just the standard extra hygiene for not applying state from an instance
    // that's already been cleaned up, not a fix for a request race.
    let ignore = false

    const init = async () => {
      try {
        await authApi.refresh()
        if (ignore) return
      } catch {
        if (ignore) return
        setUser(null)
        localStorage.removeItem(USER_STORAGE_KEY)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    init()

    return () => {
      ignore = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await authApi.login({ email, password })
    setUser(loggedInUser)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser))
    return { mustChangePassword: loggedInUser.mustChangePassword ?? false }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    setUser(null)
    localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  // Called once the change-password flow succeeds, so RoleGuard stops
  // bouncing the user back to /login for a flag the server has already cleared.
  const clearMustChangePassword = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, mustChangePassword: false }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, clearMustChangePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
