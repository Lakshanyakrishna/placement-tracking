import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAuth } from '@/contexts/AuthContext'
import { useStudentDashboardData } from '@/hooks/useStudentDashboardData'
import * as participationsApi from '@/api/participations.api'
import * as submissionsApi from '@/api/submissions.api'
import * as sectionsApi from '@/api/sections.api'
import * as groupsApi from '@/api/groups.api'
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react'
import type { Participation } from '@/types/participation'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted For Verification', className: 'bg-yellow-100 text-yellow-700' },
  verified: { label: 'Verified', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useStudentDashboardData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: enrollmentInfo } = useQuery({
    queryKey: ['student-enrollment-info', user?.id],
    queryFn: async () => {
      const [sections, groups] = await Promise.all([
        sectionsApi.listSections(),
        groupsApi.listGroups(),
      ])
      const section = sections?.[0]
      const group = section ? groups?.find((g) => g.sectionId === section.id) : null
      return { section, group }
    },
    enabled: !!user,
  })

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  function formatDate(d: string | null): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function handleStart(opportunityId: string) {
    try {
      await participationsApi.createParticipation({ opportunityId })
      refetch()
    } catch (e: any) {
      console.error('Failed to start certification:', e)
    }
  }

  async function handleContinue(participationId: string) {
    try {
      await participationsApi.updateParticipationStatus(participationId, { status: 'in_progress' })
      refetch()
    } catch (e: any) {
      console.error('Failed to update status:', e)
    }
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

  const parts = data.certifications
  const notStarted = parts.filter((c) => c.status === 'not_started')
  const inProgress = parts.filter((c) => c.status === 'in_progress')
  const submitted = parts.filter((c) => c.status === 'submitted')
  const completed = parts.filter((c) => c.status === 'verified' || c.status === 'completed')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Welcome, {data.name}</h1>
        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>Section: {data.sectionName}</span>
          <span>Group: {enrollmentInfo?.group?.name ?? '—'}</span>
          <span>Roll Number: {data.rollNumber || '—'}</span>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2"><FileText className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned</p>
              <p className="text-lg font-bold">{data.summary.assigned}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2"><Clock className="h-4 w-4 text-orange-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-lg font-bold">{data.summary.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2"><CheckCircle className="h-4 w-4 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold">{data.summary.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-2"><AlertCircle className="h-4 w-4 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Verification</p>
              <p className="text-lg font-bold">{data.summary.pendingVerification}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main: Certifications + Upload side-by-side */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* My Certifications Table */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">My Certifications</h2>
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
                {parts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No certifications have been assigned yet.
                    </td>
                  </tr>
                )}
                {parts.map((cert) => {
                  const badge = STATUS_BADGE[cert.status] ?? { label: cert.status, className: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={cert.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{cert.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(cert.assignedDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(cert.deadline)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cert.status === 'not_started' && (
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleStart(cert.opportunityId)}>Start</Button>
                        )}
                        {cert.status === 'in_progress' && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" className="h-7 text-xs" onClick={() => handleContinue(cert.participationId!)}>Continue</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUploadClick(cert.participationId!)}>Upload</Button>
                          </div>
                        )}
                        {cert.status === 'submitted' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" />View Submission</Button>
                        )}
                        {(cert.status === 'verified' || cert.status === 'completed') && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" />View Certificate</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Certificate Panel */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Upload Certificate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Completed a certification? Upload your certificate for verification.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileSelected}
              />
              {uploadError && (
                <p className="text-xs text-red-600 mb-2">{uploadError}</p>
              )}
              <Button
                className="w-full text-xs"
                size="sm"
                onClick={() => {
                  setSelectedPartId(parts.find((p) => p.status === 'in_progress')?.participationId ?? null)
                  setUploadError(null)
                  fileInputRef.current?.click()
                }}
                disabled={!parts.some((p) => p.status === 'in_progress') || !!uploading}
              >
                <Upload className="h-3 w-3 mr-1" />
                {uploading ? 'Uploading...' : 'Upload Certificate'}
              </Button>
              {!parts.some((p) => p.status === 'in_progress') && (
                <p className="text-xs text-muted-foreground mt-2">Start a certification first to upload.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Recent Updates</h3>
            <div className="space-y-2">
              {data.recentUpdates.length === 0 && (
                <p className="text-xs text-muted-foreground">No recent updates.</p>
              )}
              {data.recentUpdates.map((u, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {u.type === 'verified' && <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />}
                  {u.type === 'submitted' && <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />}
                  {u.type === 'started' && <Clock className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />}
                  {u.type === 'assigned' && <FileText className="h-3 w-3 text-gray-500 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-muted-foreground">{u.message}</p>
                    <p className="text-muted-foreground/60">{formatDate(u.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
