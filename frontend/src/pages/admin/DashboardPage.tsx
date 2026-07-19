import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData'
import { CertHeatmap } from '@/components/dashboard/CertHeatmap'
import { FollowUpQueue } from '@/components/dashboard/FollowUpQueue'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { BentoCard, BentoGrid } from '@/components/ui/bento-card'
import { CompletionGauge } from '@/components/dashboard/CompletionGauge'
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import * as sectionsApi from '@/api/sections.api'
import { Users, Layers, ShieldCheck, LayoutDashboard } from 'lucide-react'

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
      <DashboardHeader
        title={sectionCode}
        subtitle="Section overview and certification tracking"
        icon={<LayoutDashboard className="h-6 w-6 text-white" />}
      />

      {/* Top Row: Stats */}
      <BentoGrid>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stmary-primary/10">
              <Users className="h-5 w-5 text-stmary-primary" />
            </div>
            <div>
              <AnimatedNumber value={data.summary.totalStudents} />
              <p className="text-xs text-[#6B7280]">Students</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Layers className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <AnimatedNumber value={data.summary.totalGroups} />
              <p className="text-xs text-[#6B7280]">Groups</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <CompletionGauge value={completionPct} />
            <div>
              <AnimatedNumber value={completionPct} suffix="%" />
              <p className="text-xs text-[#6B7280]">Cert Completion</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <ShieldCheck className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <AnimatedNumber value={data.summary.pendingFollowUps} />
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
        <ResponsiveContainer width="100%" height={Math.max(220, data.groupPerformance.length * 56)}>
          <BarChart
            data={data.groupPerformance.map((g) => ({
              name: g.groupName,
              Completed: g.completed,
              'In Progress': g.inProgress,
              'Not Started': g.notStarted,
            }))}
            layout="vertical"
            margin={{ left: 8 }}
          >
            <defs>
              <linearGradient id="adminCompletedGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8f1919" />
                <stop offset="100%" stopColor="#b82020" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Completed" stackId="a" fill="url(#adminCompletedGradient)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="In Progress" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Not Started" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </BentoCard>

      {/* Third Row: Cert Matrix + Follow-ups — items-stretch so the Follow-up
          Queue card matches the Certification Matrix card's height exactly,
          with its own list scrolling internally rather than growing the page. */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BentoCard className="flex h-full flex-col" colSpan={2}>
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Certification Matrix</h2>
            <CertHeatmap rows={data.certHeatmap} groupNames={groupNames} />
          </BentoCard>
        </div>
        <div>
          <BentoCard className="flex h-full flex-col">
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Follow-up Queue</h2>
            <FollowUpQueue items={data.followUpQueue} />
          </BentoCard>
        </div>
      </div>
    </div>
  )
}
