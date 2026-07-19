import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData'
import { CertHeatmap } from '@/components/dashboard/CertHeatmap'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { BentoCard, BentoGrid } from '@/components/ui/bento-card'
import { CompletionGauge } from '@/components/dashboard/CompletionGauge'
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import * as sectionsApi from '@/api/sections.api'
import { Users, Layers, ShieldCheck, LayoutDashboard, X } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboardData()
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.listSections(),
  })
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  const section = sections?.[0]
  const sectionCode = section?.code ?? 'Section'

  const groupNames = data.groupPerformance.map((g) => g.groupName)
  const selectedGroup = data.groupPerformance.find((g) => g.groupId === selectedGroupId) ?? null
  const drillDownRows = selectedGroupId ? data.groupDetails[selectedGroupId] ?? [] : []

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#111827]">Group Performance</h2>
          <p className="text-xs text-[#6B7280]">Click a bar to see student-level detail</p>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(220, data.groupPerformance.length * 56)}>
          <BarChart
            data={data.groupPerformance.map((g) => ({
              name: g.groupName,
              groupId: g.groupId,
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
            <Bar
              dataKey="Completed"
              stackId="a"
              fill="url(#adminCompletedGradient)"
              radius={[0, 0, 0, 0]}
              className="cursor-pointer"
              onClick={(_, index) => setSelectedGroupId(data.groupPerformance[index].groupId)}
            />
            <Bar
              dataKey="In Progress"
              stackId="a"
              fill="#f59e0b"
              className="cursor-pointer"
              onClick={(_, index) => setSelectedGroupId(data.groupPerformance[index].groupId)}
            />
            <Bar
              dataKey="Not Started"
              stackId="a"
              fill="#e5e7eb"
              radius={[0, 4, 4, 0]}
              className="cursor-pointer"
              onClick={(_, index) => setSelectedGroupId(data.groupPerformance[index].groupId)}
            />
          </BarChart>
        </ResponsiveContainer>

        <AnimatePresence>
          {selectedGroup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{selectedGroup.groupName}</p>
                    <p className="text-xs text-[#6B7280]">
                      {selectedGroup.students} students &middot; {selectedGroup.completionPct}% complete
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedGroupId(null)}
                    aria-label="Close drill-down"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/95">
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Roll Number</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Student</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Certification</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drillDownRows.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            No participations yet for this group.
                          </td>
                        </tr>
                      )}
                      {drillDownRows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-2 font-mono text-xs">{row.rollNumber}</td>
                          <td className="px-4 py-2 font-medium">{row.studentName}</td>
                          <td className="px-4 py-2">{row.opportunityTitle}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${
                                STATUS_BADGE[row.status] ?? 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {row.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BentoCard>

      {/* Third Row: Certification Completion Heatmap — the detailed Follow-up
          Queue now lives on the Mentor dashboard (see mentor/DashboardPage.tsx),
          scoped to the mentor's own section; admins still see the aggregate
          count above. No heading here — CertHeatmap renders its own, so this
          card doesn't show two different, mismatched titles stacked on top
          of each other. */}
      <BentoCard colSpan={4}>
        <CertHeatmap rows={data.certHeatmap} groupNames={groupNames} />
      </BentoCard>
    </div>
  )
}
