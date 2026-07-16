import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import * as participationsApi from '@/api/participations.api'
import * as submissionsApi from '@/api/submissions.api'
import * as opportunitiesApi from '@/api/opportunities.api'
import { Briefcase, Eye, Upload, Play, Sparkles, XCircle, ExternalLink } from 'lucide-react'
import { isPlacementType } from '@/lib/constants'

type StatusFilter = 'all' | 'available' | 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'completed' | 'rejected'

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'verified', label: 'Verified' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
]

function getUrgency(closesAt: string | null | undefined): { label: string; className: string } | null {
  if (!closesAt) return null
  const days = Math.ceil((new Date(closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: `${Math.abs(days)} days overdue`, className: 'text-red-600' }
  if (days <= 7) return { label: `${days} days left`, className: 'text-orange-600' }
  if (days <= 30) return { label: `${days} days left`, className: 'text-yellow-600' }
  return null
}

export default function PlacementsPage() {
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState<StatusFilter>(() => {
    const f = searchParams.get('filter')
    if (f === 'rejected') return 'rejected'
    return 'all'
  })
  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: parts, isLoading, error, refetch } = useQuery({
    queryKey: ['my-participations'],
    queryFn: async () => {
      const res = await participationsApi.getMyParticipations()
      return res.data ?? []
    },
  })

  const { data: availableOpps, isLoading: availableLoading, refetch: refetchAvailable } = useQuery({
    queryKey: ['available-opportunities'],
    queryFn: async () => {
      return await opportunitiesApi.getAvailableOpportunities()
    },
  })

  useEffect(() => {
    const f = searchParams.get('filter')
    if (f === 'rejected') setFilter('rejected')
  }, [searchParams])

  function formatDate(d: string | null): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function handleStart(opportunityId: string) {
    try {
      await participationsApi.createParticipation({ opportunityId })
      refetch()
      refetchAvailable()
    } catch { /* ignore */ }
  }

  async function handleContinue(id: string) {
    try {
      await participationsApi.updateParticipationStatus(id, { status: 'in_progress' })
      refetch()
    } catch { /* ignore */ }
  }

  function handleUploadClick(participationId: string) {
    setSelectedPartId(participationId)
    setUploadError(null)
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedPartId) return

    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      setUploadError('Only PDF, JPG and PNG files are accepted')
      return
    }

    setUploading(selectedPartId)
    setUploadError(null)
    try {
      await submissionsApi.createSubmission(selectedPartId, [file], 'Placement proof upload')
      refetch()
      setSelectedPartId(null)
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? 'Upload failed. Try again.')
    } finally {
      setUploading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isLoading && availableLoading) return <LoadingSpinner fullPage />
  if (error) return <ErrorState onRetry={refetch} />

  const placementParts = (parts ?? []).filter((p) => isPlacementType(p.opportunity?.opportunityType ?? p.opportunityType ?? ''))
  const placementAvailable = (availableOpps ?? []).filter((o) => isPlacementType(o.opportunityType))

  const filtered = filter === 'all'
    ? placementParts
    : placementParts.filter((p) => p.status === filter)

  const statusColor = (status: string): string => {
    const map: Record<string, string> = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      submitted: 'bg-yellow-100 text-yellow-700',
      verified: 'bg-green-100 text-green-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return map[status] ?? 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#111827]">My Placements</h1>
        <p className="mt-1 text-sm text-[#6B7280]">View and manage all your assigned and available placement drives.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#111827] text-white'
                : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}

      {filter === 'available' ? (
        <>
          {placementAvailable.length === 0 && (
            <div className="rounded-xl border py-12 text-center text-sm text-[#6B7280]">
              <Sparkles className="mx-auto h-8 w-8 mb-2 text-[#D1D5DB]" />
              No placement drives available right now.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {placementAvailable.map((opp) => {
              const urgency = getUrgency(opp.closesAt)
              return (
                <Card key={opp.id} className="hover:shadow-md transition-shadow border-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm font-medium text-[#111827]">{opp.title}</p>
                      <span className="shrink-0 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        Available
                      </span>
                    </div>
                    {urgency && (
                      <p className={`text-xs font-medium mb-1 ${urgency.className}`}>{urgency.label}</p>
                    )}
                    <div className="space-y-1 text-xs text-[#6B7280] mb-4">
                      {opp.closesAt && <p>Deadline: {formatDate(opp.closesAt)}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleStart(opp.id)}>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                      {opp.applicationLink && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                          <a href={opp.applicationLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Apply
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      ) : (
        <>
          {filtered.length === 0 && (
            <div className="rounded-xl border py-12 text-center text-sm text-[#6B7280]">
              <Briefcase className="mx-auto h-8 w-8 mb-2 text-[#D1D5DB]" />
              {filter === 'all' && placementAvailable.length > 0 ? (
                <>
                  <p>You haven't started any placement drives yet.</p>
                  <button onClick={() => setFilter('available')} className="mt-2 text-xs font-medium text-[#B91C1C] hover:underline">
                    View {placementAvailable.length} available drive{placementAvailable.length > 1 ? 's' : ''} →
                  </button>
                </>
              ) : (
                <p>No placement drives match this filter.</p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((drive) => {
              const urgency = getUrgency(drive.opportunity?.closesAt)
              return (
                <Card key={drive.id} className={`hover:shadow-md transition-shadow ${drive.status === 'rejected' ? 'border-red-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm font-medium text-[#111827]">
                        {drive.opportunity?.title ?? drive.opportunityTitle ?? 'Unknown'}
                      </p>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium ${statusColor(drive.status)}`}>
                        {drive.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>

                    {urgency && (
                      <p className={`text-xs font-medium mb-1 ${urgency.className}`}>{urgency.label}</p>
                    )}

                    <div className="space-y-1 text-xs text-[#6B7280] mb-4">
                      <p>Assigned: {formatDate(drive.createdAt)}</p>
                      <p>Deadline: {formatDate(drive.opportunity?.closesAt ?? null)}</p>
                    </div>

                    {drive.status === 'rejected' && drive.notes && (
                      <div className="mb-3 flex items-start gap-1.5 rounded-md bg-red-50 p-2 text-xs text-red-700">
                        <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{drive.notes}</span>
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      {drive.status === 'not_started' && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleContinue(drive.id)}>
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {drive.status === 'in_progress' && (
                        <>
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleContinue(drive.id)}>
                            Continue
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUploadClick(drive.id)} disabled={uploading === drive.id}>
                            <Upload className="h-3 w-3 mr-1" />
                            {uploading === drive.id ? 'Uploading...' : 'Upload'}
                          </Button>
                        </>
                      )}
                      {drive.status === 'submitted' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View Submission
                        </Button>
                      )}
                      {(drive.status === 'verified' || drive.status === 'completed') && (
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View Offer Letter
                        </Button>
                      )}
                      {drive.status === 'rejected' && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleUploadClick(drive.id)}>
                          Re-upload
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
