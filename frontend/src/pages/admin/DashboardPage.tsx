import { useAdminDashboardData } from '@/hooks/useAdminDashboardData'
import { CertHeatmap } from '@/components/dashboard/CertHeatmap'
import { FollowUpQueue } from '@/components/dashboard/FollowUpQueue'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Layers, Award, ShieldCheck, GraduationCap } from 'lucide-react'

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboardData()

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  const groupNames = data.groupPerformance.map((g) => g.groupName)

  const totalCompleted = data.groupPerformance.reduce((s, g) => s + g.completed, 0)
  const totalStarted = data.groupPerformance.reduce((s, g) => s + g.completed + g.inProgress + g.notStarted, 0)
  const completionPct = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0
  const pendingV = data.groupPerformance.reduce((s, g) => s + (g.students - g.completed - g.inProgress - g.notStarted), 0)

  return (
    <div className="space-y-6">
      {/* Section Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-stmarys" />
            Section Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-bold">IV-AI&DS-A</h3>
            <p className="text-xs text-muted-foreground">
              Artificial Intelligence &amp; Data Science
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <Users className="mx-auto h-5 w-5 text-stmarys" />
              <p className="mt-1 text-xl font-bold">{data.summary.totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <Layers className="mx-auto h-5 w-5 text-stmarys" />
              <p className="mt-1 text-xl font-bold">{data.summary.totalGroups}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <Award className="mx-auto h-5 w-5 text-stmarys" />
              <p className="mt-1 text-xl font-bold">{completionPct}%</p>
              <p className="text-xs text-muted-foreground">Cert Completion</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <ShieldCheck className="mx-auto h-5 w-5 text-stmarys" />
              <p className="mt-1 text-xl font-bold">{data.summary.pendingFollowUps}</p>
              <p className="text-xs text-muted-foreground">Pending Verifications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Performance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Group Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Students</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Completed</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">In Progress</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pending Verification</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Not Started</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Completion %</th>
                </tr>
              </thead>
              <tbody>
                {data.groupPerformance.map((g) => (
                  <tr key={g.groupId} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{g.groupName}</td>
                    <td className="px-4 py-3 text-center">{g.students}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{g.completed}</td>
                    <td className="px-4 py-3 text-center text-blue-600">{g.inProgress}</td>
                    <td className="px-4 py-3 text-center text-yellow-600">
                      {g.students - g.completed - g.inProgress - g.notStarted}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{g.notStarted}</td>
                    <td className="px-4 py-3 text-center font-semibold">{g.completionPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Certification Matrix */}
      <CertHeatmap rows={data.certHeatmap} groupNames={groupNames} />

      {/* Follow-Up Queue */}
      <FollowUpQueue items={data.followUpQueue} />
    </div>
  )
}
