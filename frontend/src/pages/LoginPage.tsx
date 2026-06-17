import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { ROLE_DASHBOARD_MAP } from '@/lib/constants'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const userRoles = [...(user.roles ?? [])]
    if (user.isStudent) userRoles.push('student')
    const firstRole = userRoles.find((r) => ROLE_DASHBOARD_MAP[r])
    if (firstRole) {
      navigate(ROLE_DASHBOARD_MAP[firstRole], { replace: true })
    }
  }, [user, navigate])

  return <LoginForm onSubmit={(data) => login(data.email, data.password)} />
}
