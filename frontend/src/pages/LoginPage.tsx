import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { ROLE_DASHBOARD_MAP } from '@/lib/constants'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!user || pendingEmail) return

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
      setPendingEmail(data.email)
    }
  }

  if (pendingEmail) {
    return (
      <ChangePasswordForm
        email={pendingEmail}
        onComplete={() => {
          setPendingEmail(null)
          const userRoles = [...(user?.roles ?? [])]
          if (user?.isStudent) userRoles.push('student')
          const firstRole = userRoles.find((r) => ROLE_DASHBOARD_MAP[r])
          if (firstRole) navigate(ROLE_DASHBOARD_MAP[firstRole], { replace: true })
        }}
      />
    )
  }

  return <LoginForm onSubmit={(data) => handleLogin(data)} />
}
