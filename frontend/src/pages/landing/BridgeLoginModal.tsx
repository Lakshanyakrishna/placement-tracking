import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { LoginScreen } from '@/pages/login/LoginScreen'
import { ROLE_DASHBOARD_MAP } from '@/lib/constants'

interface BridgeLoginModalProps {
  onClose: () => void
}

// This is the lazy-loaded content of the login modal (see LandingPage.tsx) — it's
// the only place framer-motion is pulled in, so keeping it out of the eager import
// graph is what keeps the landing page's own Lighthouse score high.
export default function BridgeLoginModal({ onClose }: BridgeLoginModalProps) {
  const { user, login, clearMustChangePassword } = useAuth()
  const navigate = useNavigate()
  const [freshLoginEmail, setFreshLoginEmail] = useState<string | null>(null)
  const [shown, setShown] = useState(false)

  const pendingEmail = user?.mustChangePassword ? user.email : freshLoginEmail

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const goToDashboard = () => {
    const userRoles = [...(user?.roles ?? [])]
    if (user?.isStudent) userRoles.push('student')
    const firstRole = userRoles.find((r) => ROLE_DASHBOARD_MAP[r])
    if (firstRole) navigate(ROLE_DASHBOARD_MAP[firstRole])
  }

  const handleLogin = async (data: { email: string; password: string }) => {
    const result = await login(data.email, data.password)
    if (result.mustChangePassword) {
      setFreshLoginEmail(data.email)
    } else {
      onClose()
      goToDashboard()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 sm:p-4 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`h-full w-full overflow-hidden bg-[#0a0a12] shadow-2xl transition-all duration-200 ease-out sm:h-[85vh] sm:max-h-[720px] sm:w-[95vw] sm:max-w-5xl sm:rounded-2xl ${
          shown ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
      >
        {pendingEmail ? (
          <div className="flex h-full items-center justify-center overflow-y-auto bg-[#FAFAFA] px-4">
            <ChangePasswordForm
              email={pendingEmail}
              onComplete={() => {
                clearMustChangePassword()
                setFreshLoginEmail(null)
                onClose()
                goToDashboard()
              }}
            />
          </div>
        ) : (
          <LoginScreen onSubmit={handleLogin} onClose={onClose} />
        )}
      </div>
    </div>
  )
}
