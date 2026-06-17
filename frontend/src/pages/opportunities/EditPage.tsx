import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useOpportunity, useUpdateOpportunity } from '@/hooks/useOpportunities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { ROUTES } from '@/lib/constants'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  opportunityType: z.string().min(1, 'Type is required'),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function OpportunityEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: opportunity, isLoading, error, refetch } = useOpportunity(id!)
  const update = useUpdateOpportunity()
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (opportunity) {
      reset({
        title: opportunity.title,
        description: opportunity.description || '',
        opportunityType: opportunity.opportunityType,
        opensAt: opportunity.opensAt ? opportunity.opensAt.slice(0, 16) : '',
        closesAt: opportunity.closesAt ? opportunity.closesAt.slice(0, 16) : '',
      })
    }
  }, [opportunity, reset])

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !opportunity) return <ErrorState onRetry={refetch} />

  const onSubmit = async (data: FormData) => {
    try {
      await update.mutateAsync({ id: id!, dto: { ...data, opensAt: data.opensAt || undefined, closesAt: data.closesAt || undefined } })
      navigate(ROUTES.ADMIN_OPPORTUNITIES)
    } catch { /* toast */ }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="placement">Placement</SelectItem>
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
