import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Users } from 'lucide-react'
import { forgotPassword } from '@/api/auth.api'
import { ROUTES } from '@/lib/constants'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginCardProps {
  onSubmit: (data: LoginFormData) => Promise<void>
}

function inputClasses() {
  return 'w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-stmary-primary focus:outline-none focus:ring-1 focus:ring-stmary-primary'
}

export function LoginCard({ onSubmit }: LoginCardProps) {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      setError(msg)
    }
  }

  const handleForgotSubmit = async () => {
    try {
      await forgotPassword(forgotEmail)
    } catch {
      // Intentionally silent — don't reveal whether the email exists.
    } finally {
      setForgotSent(true)
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
      <AnimatePresence mode="wait">
        {forgotOpen ? (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {forgotSent ? (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  If an account exists for that email, a reset link has been sent.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(false)
                    setForgotSent(false)
                  }}
                  className="mt-4 text-sm font-medium text-stmary-primary hover:text-stmary-primary-dark"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <div>
                <h2 className="font-stmary text-xl font-bold text-gray-900">Reset password</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
                <div className="relative mt-5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Email address"
                    className={inputClasses()}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleForgotSubmit}
                  disabled={!forgotEmail}
                  className="mt-4 w-full rounded-lg bg-stmary-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stmary-primary-dark disabled:opacity-50"
                >
                  Send reset link
                </button>
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2]">
                <Users className="h-6 w-6 text-stmary-primary" />
              </div>
              <h2 className="font-stmary text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-1 text-sm text-gray-500">Sign in to your placement tracker account</p>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-4">
              <div>
                <label htmlFor="login-email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Email address"
                    className={inputClasses()}
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="login-password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className={inputClasses()}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide typed characters' : 'Show typed characters'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-stmary-primary"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="font-medium text-stmary-primary hover:text-stmary-primary-dark"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-stmary-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stmary-primary-dark disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Need help?{' '}
              <Link to={ROUTES.HELP} className="font-medium text-stmary-primary hover:text-stmary-primary-dark">
                Login &amp; access help
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
