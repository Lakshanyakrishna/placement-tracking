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
  const [pendingRedirect, setPendingRedirect] = useState(false)

  const pendingEmail = user?.mustChangePassword ? user.email : freshLoginEmail

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    // Without this, the landing page behind the modal can still be scrolled on
    // mobile (this dialog is `position: fixed`, not a real overlay that traps
    // scroll) — the background visibly drifts under the fixed modal as the user
    // scrolls, which is jarring and can even desync iOS Safari's fixed-position
    // rendering. Restore the original value on close rather than assuming '',
    // in case something else on the page already set it.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  // `login()`/`clearMustChangePassword()` update AuthContext's `user` state, but
  // that update isn't visible in this closure until the next render — reading
  // `user` synchronously right after calling either of those (as an earlier
  // version of this file did) silently redirects nowhere. Deferring the redirect
  // to an effect that watches `user` is the same pattern the original
  // (pre-modal) LoginPage.tsx used, and is the only way to see the fresh value.
  useEffect(() => {
    if (!pendingRedirect || !user || user.mustChangePassword) return
    const userRoles = [...(user.roles ?? [])]
    if (user.isStudent) userRoles.push('student')
    const firstRole = userRoles.find((r) => ROLE_DASHBOARD_MAP[r])
    if (firstRole) {
      setPendingRedirect(false)
      onClose()
      navigate(ROLE_DASHBOARD_MAP[firstRole])
    }
  }, [pendingRedirect, user, navigate, onClose])

  const handleLogin = async (data: { email: string; password: string }) => {
    const result = await login(data.email, data.password)
    if (result.mustChangePassword) {
      setFreshLoginEmail(data.email)
    } else {
      setPendingRedirect(true)
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
                setPendingRedirect(true)
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
