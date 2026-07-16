import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_DASHBOARD_MAP } from '@/lib/constants'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner fullPage />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // A user who hasn't completed their forced password change must not reach any
  // protected route by direct URL navigation — send them back through /login,
  // which detects mustChangePassword and renders the change-password gate itself.
  if (user?.mustChangePassword) return <Navigate to="/login" replace />

  const userRoles = [...(user?.roles ?? [])]
  if (user?.isStudent) userRoles.push('student')

  const hasRole = allowedRoles.some((r) => userRoles.includes(r))
  if (!hasRole) {
    const firstRole = userRoles.find((r) => ROLE_DASHBOARD_MAP[r])
    return <Navigate to={firstRole ? ROLE_DASHBOARD_MAP[firstRole] : '/login'} replace />
  }

  return <>{children}</>
}
