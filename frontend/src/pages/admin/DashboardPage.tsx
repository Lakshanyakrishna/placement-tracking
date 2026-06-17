import { useAdminDashboardData } from '@/hooks/useAdminDashboardData'
import { HeroSection } from '@/components/dashboard/HeroSection'
import { OpportunityStatsTable } from '@/components/dashboard/OpportunityStatsTable'
import { GroupPerformanceCards } from '@/components/dashboard/GroupPerformanceCards'
import { GroupRanking } from '@/components/dashboard/GroupRanking'
import { CertHeatmap } from '@/components/dashboard/CertHeatmap'
import { StudentsRequiringAttention } from '@/components/dashboard/StudentsRequiringAttention'
import { FollowUpQueue } from '@/components/dashboard/FollowUpQueue'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboardData()

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  const groupNames = data.groupPerformance.map((g) => g.groupName)

  return (
    <div className="space-y-6">
      {/* 1. Hero Section */}
      <HeroSection
        totalStudents={data.summary.totalStudents}
        totalGroups={data.summary.totalGroups}
        certificationsPosted={data.summary.totalCertifications}
        activeCertifications={data.summary.activeOpportunities}
      />

      {/* 3. Certification Opportunities (most important) */}
      <OpportunityStatsTable rows={data.certificationStats} />

      {/* 4. Group Performance + 5. Group Ranking side-by-side */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GroupPerformanceCards rows={data.groupPerformance} />
        </div>
        <div>
          <GroupRanking entries={data.groupRanking} />
        </div>
      </div>

      {/* 6. Certification Heatmap */}
      <CertHeatmap rows={data.certHeatmap} groupNames={groupNames} />

      {/* 7. Students Requiring Attention */}
      <StudentsRequiringAttention students={data.atRiskStudents} />

      {/* 8. Follow-Up Queue */}
      <FollowUpQueue items={data.followUpQueue} />
    </div>
  )
}
