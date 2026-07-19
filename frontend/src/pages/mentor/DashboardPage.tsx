import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users, Layers, Briefcase, ShieldCheck } from 'lucide-react'
import { useMentorDashboard } from '@/hooks/useDashboard'
import { useCertificationAnalytics } from '@/hooks/useAnalytics'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { CertificationBreakdownTable } from '@/components/analytics/CertificationBreakdownTable'
import { BentoCard, BentoGrid } from '@/components/ui/bento-card'
import { CompletionGauge } from '@/components/dashboard/CompletionGauge'
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

const STATUS_COLORS = { submitted: '#eab308', verified: '#10b981', rejected: '#ef4444' }

export default function MentorDashboardPage() {
  const { data, isLoading, error, refetch } = useMentorDashboard()
  const { data: groups, isLoading: groupsLoading } = useCertificationAnalytics()

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  const statusData = [
    { name: 'Submitted', value: data.submitted, color: STATUS_COLORS.submitted },
    { name: 'Verified', value: data.verified, color: STATUS_COLORS.verified },
    { name: 'Rejected', value: data.rejected, color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0)

  const groupCompletionData = (groups ?? []).map((g) => {
    const totals = g.certifications.reduce(
      (acc, c) => ({ done: acc.done + c.verified + c.completed, total: acc.total + c.totalStudents }),
      { done: 0, total: 0 },
    )
    return {
      name: g.groupName,
      rate: totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0,
    }
  })

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Mentor Dashboard"
        subtitle="Your section performance overview"
        icon={<ShieldCheck className="h-6 w-6 text-white" />}
      />

      <BentoGrid>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stmary-primary/10">
              <Layers className="h-5 w-5 text-stmary-primary" />
            </div>
            <div>
              <AnimatedNumber value={data.assignedSections} />
              <p className="text-xs text-muted-foreground">Assigned Sections</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <AnimatedNumber value={data.totalStudents} />
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Briefcase className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <AnimatedNumber value={data.opportunitiesActive} />
              <p className="text-xs text-muted-foreground">Opportunities Active</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-3">
            <CompletionGauge value={data.completionRate} />
            <div>
              <AnimatedNumber value={data.completionRate} suffix="%" />
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <BentoCard>
          <h2 className="mb-1 text-sm font-semibold text-foreground">Verification Status</h2>
          <p className="mb-2 text-xs text-muted-foreground">Submitted, verified, and rejected across your section</p>
          {statusData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
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
          )}
        </BentoCard>

        <BentoCard>
          <h2 className="mb-1 text-sm font-semibold text-foreground">Completion by Group</h2>
          <p className="mb-2 text-xs text-muted-foreground">Verified + completed as a share of each group's enrollment</p>
          {groupCompletionData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No groups yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={groupCompletionData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="mentorRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b82020" />
                    <stop offset="100%" stopColor="#8f1919" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" fill="url(#mentorRateGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </BentoCard>
      </div>

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
