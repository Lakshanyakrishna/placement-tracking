import { useState } from 'react'
import { useTeamLeaderDashboard } from '@/hooks/useDashboard'
import { usePendingVerifications, useApproveSubmission, useRejectSubmission } from '@/hooks/useVerifications'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatGrid } from '@/components/dashboard/StatGrid'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { PendingSubmission } from '@/types/verification'

export default function TeamLeaderDashboardPage() {
  const { data: dash, isLoading: dashLoading, error: dashError, refetch: refetchDash } = useTeamLeaderDashboard()
  const { data: pending, isLoading: pendingLoading, error: pendingError, refetch: refetchPending } = usePendingVerifications()
  const approve = useApproveSubmission()
  const reject = useRejectSubmission()

  const [rejectTarget, setRejectTarget] = useState<PendingSubmission | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  if (dashLoading || pendingLoading) return <LoadingSpinner fullPage />
  if (dashError || !dash) return <ErrorState onRetry={refetchDash} />

  const handleApprove = async (submissionId: string) => {
    try { await approve.mutateAsync(submissionId) } catch { /* toast would go here */ }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    try {
      await reject.mutateAsync({ submissionId: rejectTarget.submissionId, dto: { reason: rejectReason } })
      setRejectTarget(null)
      setRejectReason('')
    } catch { /* toast would go here */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Leader Dashboard</h1>
        <p className="text-muted-foreground">Your groups and pending verifications</p>
      </div>
      <StatGrid className="xl:grid-cols-5">
        <StatCard title="Assigned Groups" value={dash.assignedGroups} />
        <StatCard title="Students" value={dash.students} />
        <StatCard title="Pending Verifications" value={dash.pendingVerifications} />
        <StatCard title="Verified" value={dash.verified} />
        <StatCard title="Rejected" value={dash.rejected} />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingError ? (
            <ErrorState onRetry={refetchPending} />
          ) : !pending || pending.length === 0 ? (
            <EmptyState title="No pending verifications" description="All submissions have been reviewed." />
          ) : (
            <div className="space-y-3">
              {pending.map((item) => (
                <div key={item.submissionId} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{item.opportunityTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.studentName} &middot; {item.studentEmail}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{item.fileCount} file{item.fileCount !== 1 ? 's' : ''}</span>
                      {item.description && <span>&middot; {item.description}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => handleApprove(item.submissionId)}
                      disabled={approve.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                      onClick={() => setRejectTarget(item)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason('') } }}
        title="Reject Submission"
        description="Provide a reason for rejection."
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={handleReject}
        loading={reject.isPending}
      >
        <div className="py-2">
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
