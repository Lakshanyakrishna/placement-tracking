import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stmarys to-stmarys-dark px-4">
      <div className="absolute left-4 top-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/80 hover:text-white"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stmarys-light">
            <GraduationCap className="h-6 w-6 text-stmarys" />
          </div>
          <CardTitle className="text-lg">Sign In</CardTitle>
          <CardDescription>St. Mary's Career Hub</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@stmarys.edu" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
