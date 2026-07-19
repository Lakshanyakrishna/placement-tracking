import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, ShieldAlert } from 'lucide-react'
import { PasswordField } from '@/components/shared/PasswordField'
import * as authApi from '@/api/auth.api'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  email: string
  onComplete: () => void
}

export function ChangePasswordForm({ email, onComplete }: ChangePasswordFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setError(null)
      await authApi.changePassword(data.currentPassword, data.newPassword)
      setSuccess(true)
      setTimeout(onComplete, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password'
      setError(msg)
    }
  }

  return (
    <Card className="w-full max-w-sm border-0 shadow-none">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2]">
          <GraduationCap className="h-6 w-6 text-[#B91C1C]" />
        </div>
        <CardTitle className="text-lg text-[#111827]">Change Password</CardTitle>
        <p className="mt-1 text-sm text-[#6B7280]">St. Mary&apos;s Career Hub</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Your administrator has requested that you change your password before continuing.
          </span>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-700">
            Password changed successfully. Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-[#111827]">Email</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <PasswordField
              id="currentPassword"
              label="Current Password"
              register={register}
              fieldName="currentPassword"
              error={errors.currentPassword?.message}
            />
            <PasswordField
              id="newPassword"
              label="New Password"
              register={register}
              fieldName="newPassword"
              error={errors.newPassword?.message}
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
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
