import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import * as submissionsApi from '@/api/submissions.api'
import * as participationsApi from '@/api/participations.api'
import { Download, FileText, XCircle, CheckCircle, Clock } from 'lucide-react'
import type { Submission } from '@/types/submission'
import type { Participation } from '@/types/participation'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Pending Verification', className: 'bg-yellow-100 text-yellow-800' },
  verified: { label: 'Verified', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' },
}

interface SubmissionRow {
  submission: Submission
  participation: Participation | null
}

export default function SubmissionsPage() {
  const { data: parts } = useQuery({
    queryKey: ['my-participations'],
    queryFn: async () => {
      const res = await participationsApi.getMyParticipations()
      return res.data ?? []
    },
  })

  const { data: submissions, isLoading, error, refetch } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => submissionsApi.getMySubmissions(),
  })

  function formatDate(d: string | null): string {
    if (!d) return '\u2014'
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function handleDownload(fileId: string, fileName: string) {
    try {
      const url = await submissionsApi.getDownloadUrl(fileId)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.target = '_blank'
      a.click()
    } catch { /* ignore */ }
  }

  if (isLoading) return <LoadingSpinner fullPage />
  if (error) return <ErrorState onRetry={refetch} />

  const participationMap = new Map(parts?.map((p) => [p.id, p]) ?? [])

  const rows: SubmissionRow[] = (submissions ?? [])
    .map((s) => ({
      submission: s,
      participation: participationMap.get(s.participationId) ?? null,
    }))
    .sort((a, b) => new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime())

  const title = (row: SubmissionRow): string =>
    row.participation?.opportunity?.title ??
    row.participation?.opportunityTitle ??
    'Unknown Certification'

  const status = (row: SubmissionRow): string =>
    row.participation?.status ?? 'submitted'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">My Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Certificates you have submitted for verification.
        </p>
      </div>

      {rows.length === 0 && (
        <div className="rounded-md border py-10 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-2 text-muted-foreground/60" />
          No submissions yet. Complete a certification and upload the certificate.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row) => {
          const badge = STATUS_BADGE[status(row)] ?? {
            label: status(row),
            className: 'bg-gray-100 text-gray-800',
          }
          return (
            <Card key={row.submission.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{title(row)}</h3>
                      <Badge className={`${badge.className} text-xs font-medium`}>
                        {badge.label}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submitted: {formatDate(row.submission.submittedAt)}
                      </div>

                      {row.submission.description && (
                        <div className="flex items-start gap-1">
                          <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>Note: {row.submission.description}</span>
                        </div>
                      )}
                    </div>

                    {/* Verifier Comment */}
                    {status(row) === 'rejected' && row.submission.rejectionReason && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-50 p-2 text-xs text-red-700">
                        <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{row.submission.rejectionReason}</span>
                      </div>
                    )}
                    {status(row) === 'verified' && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-green-50 p-2 text-xs text-green-700">
                        <CheckCircle className="h-3 w-3 shrink-0" />
                        <span>Verification approved</span>
                      </div>
                    )}
                  </div>

                  {/* Files */}
                  {row.submission.files.length > 0 && (
                    <div className="shrink-0 space-y-1">
                      {row.submission.files.map((f) => (
                        <Button
                          key={f.id}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleDownload(f.id, f.fileName)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {f.fileName}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
