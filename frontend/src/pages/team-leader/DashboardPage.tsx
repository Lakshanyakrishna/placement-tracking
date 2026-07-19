import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTeamLeaderDashboard } from '@/hooks/useDashboard'
import { usePendingVerifications, useApproveSubmission, useRejectSubmission } from '@/hooks/useVerifications'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BentoCard, BentoGrid } from '@/components/ui/bento-card'
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { CheckCircle, XCircle, Users, Layers, Clock, Award } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { PendingSubmission } from '@/types/verification'

const STATUS_COLORS = { pending: '#eab308', verified: '#10b981', rejected: '#ef4444' }

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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

  const statusData = [
    { name: 'Pending', value: dash.pendingVerifications, color: STATUS_COLORS.pending },
    { name: 'Verified', value: dash.verified, color: STATUS_COLORS.verified },
    { name: 'Rejected', value: dash.rejected, color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Team Leader Dashboard"
        subtitle="Your groups and pending verifications"
        icon={<Users className="h-6 w-6 text-white" />}
      />

      <BentoGrid>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stmary-primary/10">
              <Layers className="h-5 w-5 text-stmary-primary" />
            </div>
            <div>
              <AnimatedNumber value={dash.assignedGroups} />
              <p className="text-xs text-muted-foreground">Assigned Groups</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <AnimatedNumber value={dash.students} />
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <AnimatedNumber value={dash.pendingVerifications} />
              <p className="text-xs text-muted-foreground">Pending Verifications</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <AnimatedNumber value={dash.verified} />
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>

      {statusData.length > 0 && (
        <BentoCard>
          <h2 className="mb-1 text-sm font-semibold text-foreground">Verification Status</h2>
          <p className="mb-2 text-xs text-muted-foreground">Across everything your groups have submitted</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </BentoCard>
      )}

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
                <div key={item.submissionId} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-stmary-primary/30 hover:bg-stmary-primary/[0.03]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stmary-gradient text-xs font-semibold text-white shadow-sm">
                      {initials(item.studentName)}
                    </div>
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
