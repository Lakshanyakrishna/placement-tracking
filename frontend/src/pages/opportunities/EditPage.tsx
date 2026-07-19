import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useOpportunity, useUpdateOpportunity } from '@/hooks/useOpportunities'
import { useAuth } from '@/contexts/AuthContext'
import * as opportunitiesApi from '@/api/opportunities.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const roundSchema = z.object({
  title: z.string().min(1, 'Round title is required').max(255),
  link: z.string().trim().url('Enter a valid URL (e.g. https://...)').optional().or(z.literal('')),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
})

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  applicationLink: z.string().trim().url('Enter a valid URL (e.g. https://...)').optional().or(z.literal('')),
  meetingLink: z.string().trim().url('Enter a valid URL (e.g. https://...)').optional().or(z.literal('')),
  opportunityType: z.string().min(1, 'Type is required'),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
  rounds: z.array(roundSchema).optional(),
})

type FormData = z.infer<typeof schema>

export default function OpportunityEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = !!user?.roles.includes('admin')
  const { data: opportunity, isLoading, error, refetch } = useOpportunity(id!)
  const update = useUpdateOpportunity()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { register, handleSubmit, setValue, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const { fields: roundFields, append: appendRound, remove: removeRound } = useFieldArray({ control, name: 'rounds' })

  useEffect(() => {
    if (opportunity) {
      reset({
        title: opportunity.title,
        description: opportunity.description || '',
        applicationLink: opportunity.applicationLink || '',
        meetingLink: opportunity.meetingLink || '',
        opportunityType: opportunity.opportunityType,
        opensAt: opportunity.opensAt ? opportunity.opensAt.slice(0, 16) : '',
        closesAt: opportunity.closesAt ? opportunity.closesAt.slice(0, 16) : '',
        rounds: (opportunity.rounds ?? []).map((r) => ({
          title: r.title,
          link: r.link || '',
          scheduledAt: r.scheduledAt ? r.scheduledAt.slice(0, 16) : '',
          notes: r.notes || '',
        })),
      })
    }
  }, [opportunity, reset])

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !opportunity) return <ErrorState onRetry={refetch} />

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      await update.mutateAsync({
        id: id!,
        dto: {
          ...data,
          applicationLink: data.applicationLink || undefined,
          meetingLink: data.meetingLink || undefined,
          opensAt: data.opensAt || undefined,
          closesAt: data.closesAt || undefined,
        },
      })
      const rounds = (data.rounds ?? []).filter((r) => r.title.trim())
      await opportunitiesApi.setOpportunityRounds(
        id!,
        rounds.map((r) => ({
          title: r.title,
          link: r.link || undefined,
          scheduledAt: r.scheduledAt || undefined,
          notes: r.notes || undefined,
        })),
      )
      navigate(ROUTES.ADMIN_OPPORTUNITIES)
    } catch (e) {
      const err = e as { response?: { data?: { details?: Array<{ message: string }>; message?: string } } }
      const details = err.response?.data?.details
      const message = Array.isArray(details) && details.length > 0
        ? details.map((d) => d.message).join(', ')
        : err.response?.data?.message ?? 'Failed to save changes. Please try again.'
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
        <h1 className="text-2xl font-bold tracking-tight">Edit Opportunity</h1>
        <p className="text-muted-foreground">Update opportunity details</p>
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
              <Select onValueChange={(v) => setValue('opportunityType', v)} defaultValue={opportunity.opportunityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(isAdmin || opportunity.opportunityType === 'internship') && <SelectItem value="internship">Internship</SelectItem>}
                  {(isAdmin || opportunity.opportunityType === 'placement') && <SelectItem value="placement">Placement</SelectItem>}
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting / Assessment Link</Label>
              <Input id="meetingLink" type="url" placeholder="https://zoom.us/j/1234567890" {...register('meetingLink')} />
              <p className="text-xs text-muted-foreground">Optional. A Zoom/meeting link or an assessment/test link, shown to students once published.</p>
              {errors.meetingLink && <p className="text-xs text-destructive">{errors.meetingLink.message}</p>}
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Rounds</Label>
                  <p className="text-xs text-muted-foreground">
                    Optional. For multi-stage drives — e.g. Round 1: Online Assessment, Round 2: Technical Interview, Round 3: HR Round — each with its own link and schedule.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendRound({ title: `Round ${roundFields.length + 1}`, link: '', scheduledAt: '', notes: '' })}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Round
                </Button>
              </div>
              {roundFields.map((field, index) => (
                <div key={field.id} className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Round title (e.g. Round 1: Online Assessment)" {...register(`rounds.${index}.title` as const)} />
                      {errors.rounds?.[index]?.title && (
                        <p className="text-xs text-destructive">{errors.rounds[index]?.title?.message}</p>
                      )}
                      <Input type="url" placeholder="Link (optional, e.g. https://zoom.us/j/...)" {...register(`rounds.${index}.link` as const)} />
                      {errors.rounds?.[index]?.link && (
                        <p className="text-xs text-destructive">{errors.rounds[index]?.link?.message}</p>
                      )}
                      <Input type="datetime-local" {...register(`rounds.${index}.scheduledAt` as const)} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRound(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {roundFields.length === 0 && (
                <p className="text-xs text-muted-foreground">No rounds added — this opportunity will use the single links above only.</p>
              )}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
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
