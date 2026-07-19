import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoginScreen } from '@/pages/login/LoginScreen'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { ROLE_DASHBOARD_MAP } from '@/lib/constants'

export default function LoginPage() {
  const { user, login, clearMustChangePassword } = useAuth()
  const navigate = useNavigate()
  const [freshLoginEmail, setFreshLoginEmail] = useState<string | null>(null)

  // Derived directly from user state rather than an effect: covers direct
  // navigation to /login while already authenticated, and RoleGuard bouncing a
  // mustChangePassword user back here from a protected route — both cases need
  // the gate to appear without waiting for a fresh login submission.
  const pendingEmail = user?.mustChangePassword ? user.email : freshLoginEmail

  useEffect(() => {
    if (!user || user.mustChangePassword || pendingEmail) return

    const userRoles = [...(user.roles ?? [])]
    if (user.isStudent) userRoles.push('student')
    const firstRole = userRoles.find((r) => ROLE_DASHBOARD_MAP[r])
    if (firstRole) {
      navigate(ROLE_DASHBOARD_MAP[firstRole], { replace: true })
    }
  }, [user, navigate, pendingEmail])

  const handleLogin = async (data: { email: string; password: string }) => {
    const result = await login(data.email, data.password)
    if (result.mustChangePassword) {
      setFreshLoginEmail(data.email)
    }
  }

  if (pendingEmail) {
    return (
      <ChangePasswordForm
        email={pendingEmail}
        onComplete={() => {
          clearMustChangePassword()
          setFreshLoginEmail(null)
          const userRoles = [...(user?.roles ?? [])]
          if (user?.isStudent) userRoles.push('student')
          const firstRole = userRoles.find((r) => ROLE_DASHBOARD_MAP[r])
          if (firstRole) navigate(ROLE_DASHBOARD_MAP[firstRole], { replace: true })
        }}
      />
    )
  }

  return <LoginScreen onSubmit={handleLogin} />
}
