import { useQuery } from '@tanstack/react-query'
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData'
import { CertHeatmap } from '@/components/dashboard/CertHeatmap'
import { FollowUpQueue } from '@/components/dashboard/FollowUpQueue'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { BentoCard, BentoGrid } from '@/components/ui/bento-card'
import * as sectionsApi from '@/api/sections.api'
import { Users, Layers, Award, ShieldCheck } from 'lucide-react'

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboardData()
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.listSections(),
  })

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  const section = sections?.[0]
  const sectionCode = section?.code ?? 'Section'

  const groupNames = data.groupPerformance.map((g) => g.groupName)

  const totalCompleted = data.groupPerformance.reduce((s, g) => s + g.completed, 0)
  const totalStarted = data.groupPerformance.reduce((s, g) => s + g.completed + g.inProgress + g.notStarted, 0)
  const completionPct = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827]">{sectionCode}</h1>
        <p className="text-sm text-[#6B7280]">Section overview and certification tracking</p>
      </div>

      {/* Top Row: Stats */}
      <BentoGrid>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{data.summary.totalStudents}</p>
              <p className="text-xs text-[#6B7280]">Students</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{data.summary.totalGroups}</p>
              <p className="text-xs text-[#6B7280]">Groups</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{completionPct}%</p>
              <p className="text-xs text-[#6B7280]">Cert Completion</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
              <ShieldCheck className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{data.summary.pendingFollowUps}</p>
              <p className="text-xs text-[#6B7280]">Pending Verification</p>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Second Row: Group Performance */}
      <BentoCard colSpan={4}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#111827]">Group Performance</h2>
        </div>
        <div className="space-y-4">
          {data.groupPerformance.map((g) => {
            const pct = g.completionPct
            return (
              <div key={g.groupId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#111827]">{g.groupName}</span>
                  <span className="text-xs text-[#6B7280]">
                    {g.completed}/{g.students} completed
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-2 rounded-full bg-[#B91C1C] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-[#6B7280]">
                  <span>{g.inProgress} in progress</span>
                  <span>{g.notStarted} not started</span>
                </div>
              </div>
            )
          })}
        </div>
      </BentoCard>

      {/* Third Row: Cert Matrix + Follow-ups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BentoCard colSpan={2}>
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Certification Matrix</h2>
            <CertHeatmap rows={data.certHeatmap} groupNames={groupNames} />
          </BentoCard>
        </div>
        <div>
          <BentoCard>
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Follow-up Queue</h2>
            <FollowUpQueue items={data.followUpQueue} />
          </BentoCard>
        </div>
      </div>
    </div>
  )
}
