import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import * as participationsApi from '@/api/participations.api'
import * as submissionsApi from '@/api/submissions.api'
import { Eye } from 'lucide-react'
import type { Participation } from '@/types/participation'

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'completed' | 'rejected'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted', className: 'bg-yellow-100 text-yellow-700' },
  verified: { label: 'Verified', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'verified', label: 'Verified' },
  { key: 'completed', label: 'Completed' },
]

export default function CertificationsPage() {
  const [filter, setFilter] = useState<StatusFilter>('all')
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

  function formatDate(d: string | null): string {
    if (!d) return '\u2014'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function handleStart(opportunityId: string) {
    try {
      await participationsApi.createParticipation({ opportunityId })
      refetch()
    } catch { /* ignore */ }
  }

  async function handleContinue(participationId: string) {
    try {
      await participationsApi.updateParticipationStatus(participationId, { status: 'in_progress' })
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
      await submissionsApi.createSubmission(selectedPartId, [file], 'Certificate upload')
      refetch()
      setSelectedPartId(null)
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? 'Upload failed. Try again.')
    } finally {
      setUploading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isLoading) return <LoadingSpinner fullPage />
  if (error) return <ErrorState onRetry={refetch} />

  const filtered = filter === 'all'
    ? (parts ?? [])
    : (parts ?? []).filter((p) => p.status === filter)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">My Certifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all your assigned certifications.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}

      {/* Certifications Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Certification Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No certifications match this filter.
                </td>
              </tr>
            )}
            {filtered.map((cert) => {
              const badge = STATUS_BADGE[cert.status] ?? {
                label: cert.status,
                className: 'bg-gray-100 text-gray-700',
              }
              return (
                <tr key={cert.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">
                    {cert.opportunity?.title ?? cert.opportunityTitle ?? 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(cert.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(cert.opportunity?.closesAt ?? null)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {cert.status === 'not_started' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleStart(cert.opportunityId)}
                      >
                        Start
                      </Button>
                    )}
                    {cert.status === 'in_progress' && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleContinue(cert.id)}
                        >
                          Continue
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleUploadClick(cert.id)}
                          disabled={uploading === cert.id}
                        >
                          {uploading === cert.id ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    )}
                    {cert.status === 'submitted' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View Submission
                      </Button>
                    )}
                    {(cert.status === 'verified' || cert.status === 'completed') && (
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View Certificate
                      </Button>
                    )}
                    {cert.status === 'rejected' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleUploadClick(cert.id)}
                      >
                        Re-upload
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
