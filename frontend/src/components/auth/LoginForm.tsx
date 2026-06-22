import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, ArrowLeft } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      setError(msg)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
      <div className="absolute left-4 top-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </div>
      <Card className="w-full max-w-sm border shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2]">
            <GraduationCap className="h-6 w-6 text-[#B91C1C]" />
          </div>
          <CardTitle className="text-lg text-[#111827]">Sign In</CardTitle>
          <p className="mt-1 text-sm text-[#6B7280]">St. Mary&apos;s Career Hub</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-[#111827]">Email</Label>
              <Input id="email" type="email" placeholder="you@stmarys.edu" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-[#111827]">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
