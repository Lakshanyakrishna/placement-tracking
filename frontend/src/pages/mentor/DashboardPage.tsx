import { useMentorDashboard } from '@/hooks/useDashboard'
import { useCertificationAnalytics } from '@/hooks/useAnalytics'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatGrid } from '@/components/dashboard/StatGrid'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { CertificationBreakdownTable } from '@/components/analytics/CertificationBreakdownTable'

export default function MentorDashboardPage() {
  const { data, isLoading, error, refetch } = useMentorDashboard()
  const { data: groups, isLoading: groupsLoading } = useCertificationAnalytics()

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h1>
        <p className="text-muted-foreground">Your section performance overview</p>
      </div>
      <StatGrid className="xl:grid-cols-4">
        <StatCard title="Assigned Sections" value={data.assignedSections} />
        <StatCard title="Total Students" value={data.totalStudents} />
        <StatCard title="Opportunities Active" value={data.opportunitiesActive} />
        <StatCard title="Submitted" value={data.submitted} />
        <StatCard title="Verified" value={data.verified} />
        <StatCard title="Rejected" value={data.rejected} />
        <StatCard title="Completion Rate" value={data.completionRate} suffix="%" />
      </StatGrid>

      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Certifications by Group</h2>
          <p className="text-sm text-muted-foreground">What each team leader has posted for their group, and how it's progressing</p>
        </div>
        {groupsLoading ? (
          <LoadingSpinner />
        ) : (
          <CertificationBreakdownTable groups={groups ?? []} />
        )}
      </div>
    </div>
  )
}
