import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateOpportunity } from '@/hooks/useOpportunities'
import { useAcademicPeriods } from '@/hooks/useAcademicPeriods'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  applicationLink: z.string().trim().url('Enter a valid URL (e.g. https://...)').optional().or(z.literal('')),
  opportunityType: z.string().min(1, 'Type is required'),
  academicPeriodId: z.string().uuid('Academic period is required'),
  visibilityScope: z.string().optional(),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function OpportunityCreatePage() {
  const navigate = useNavigate()
  const create = useCreateOpportunity()
  const { user } = useAuth()
  const { data: academicPeriods, isLoading: periodsLoading } = useAcademicPeriods()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { opportunityType: '', academicPeriodId: '' },
  })
  const academicPeriodId = watch('academicPeriodId')
  const visibilityScope = watch('visibilityScope')

  const isAdmin = !!user?.roles.includes('admin')
  const isTeamLeader = !!user?.roles.includes('team_leader')
  const isMentor = !!user?.roles.includes('mentor')
  const scopeOptions = [
    ...(isTeamLeader ? [{ value: 'group', label: 'My Group Only' }] : []),
    ...(isMentor ? [{ value: 'section', label: 'Entire Section (All Groups)' }] : []),
  ]

  useEffect(() => {
    if (academicPeriods && academicPeriods.length === 1) {
      setValue('academicPeriodId', academicPeriods[0].id)
    }
  }, [academicPeriods, setValue])

  useEffect(() => {
    if (!isAdmin && scopeOptions.length === 1) {
      setValue('visibilityScope', scopeOptions[0].value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      await create.mutateAsync({
        ...data,
        applicationLink: data.applicationLink || undefined,
        opensAt: data.opensAt || undefined,
        closesAt: data.closesAt || undefined,
        visibilityScope: isAdmin ? undefined : (data.visibilityScope as 'group' | 'section' | undefined),
      })
      navigate(ROUTES.ADMIN_OPPORTUNITIES)
    } catch (e) {
      const err = e as { response?: { data?: { details?: Array<{ message: string }>; message?: string } } }
      const details = err.response?.data?.details
      const message = Array.isArray(details) && details.length > 0
        ? details.map((d) => d.message).join(', ')
        : err.response?.data?.message ?? 'Failed to create opportunity. Please try again.'
      setSubmitError(message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => navigate(ROUTES.ADMIN_OPPORTUNITIES)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to {isAdmin ? 'Opportunities' : 'Certifications'}
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{isAdmin ? 'Create Opportunity' : 'Post a Certification'}</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Create a new placement opportunity (saved as draft)' : 'Create a certification for your students (saved as draft)'}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select onValueChange={(v) => setValue('opportunityType', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="internship">Internship</SelectItem>}
                  {isAdmin && <SelectItem value="placement">Placement</SelectItem>}
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.opportunityType && <p className="text-xs text-destructive">{errors.opportunityType.message}</p>}
            </div>
            {!isAdmin && scopeOptions.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="visibilityScope">Visible To</Label>
                <Select
                  value={visibilityScope}
                  onValueChange={(v) => setValue('visibilityScope', v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="academicPeriodId">Academic Period</Label>
              <Select
                disabled={periodsLoading}
                value={academicPeriodId || undefined}
                onValueChange={(v) => setValue('academicPeriodId', v)}
              >
                <SelectTrigger><SelectValue placeholder={periodsLoading ? 'Loading...' : 'Select academic period'} /></SelectTrigger>
                <SelectContent>
                  {(academicPeriods ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicPeriodId && <p className="text-xs text-destructive">{errors.academicPeriodId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationLink">Application Link</Label>
              <Input id="applicationLink" type="url" placeholder="https://company.example.com/careers/apply" {...register('applicationLink')} />
              <p className="text-xs text-muted-foreground">Optional. Shown to students as an "Apply" link once published.</p>
              {errors.applicationLink && <p className="text-xs text-destructive">{errors.applicationLink.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opensAt">Opens At</Label>
                <Input id="opensAt" type="datetime-local" {...register('opensAt')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closesAt">Closes At</Label>
                <Input id="closesAt" type="datetime-local" {...register('closesAt')} />
              </div>
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Draft'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.ADMIN_OPPORTUNITIES)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
