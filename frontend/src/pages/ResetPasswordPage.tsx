import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordField } from '@/components/shared/PasswordField'
import { ROUTES } from '@/lib/constants'
import * as authApi from '@/api/auth.api'

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (data: FormData) => {
    if (!token) return
    try {
      setError(null)
      await authApi.resetPassword(token, data.password)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'This reset link is invalid or has expired.'
      setError(msg)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-12">
      <Card className="w-full max-w-sm border-gray-200 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stmary-primary/10">
            <KeyRound className="h-6 w-6 text-stmary-primary" />
          </div>
          <CardTitle className="text-lg text-[#111827]">Reset Password</CardTitle>
          <p className="mt-1 text-sm text-[#6B7280]">St. Mary&apos;s Career Hub</p>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="flex flex-col items-center gap-3 rounded-md bg-red-50 p-4 text-center text-sm text-red-700">
              <XCircle className="h-5 w-5 shrink-0" />
              <p>This reset link is missing its token. Request a new one from the sign-in page.</p>
              <Link to={ROUTES.LOGIN} className="font-medium text-stmary-primary hover:text-stmary-primary-dark">
                Back to sign in
              </Link>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-3 rounded-md bg-green-50 p-4 text-center text-sm text-green-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p>Your password has been reset. You can now sign in with your new password.</p>
              <Link to={ROUTES.LOGIN} className="font-medium text-stmary-primary hover:text-stmary-primary-dark">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-[#6B7280]">Choose a new password for your account.</p>
              <PasswordField
                id="password"
                label="New Password"
                register={register}
                fieldName="password"
                error={errors.password?.message}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                register={register}
                fieldName="confirmPassword"
                error={errors.confirmPassword?.message}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
