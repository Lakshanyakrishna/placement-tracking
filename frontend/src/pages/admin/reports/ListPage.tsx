import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useCertificationAnalytics } from '@/hooks/useAnalytics'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card, CardContent } from '@/components/ui/card'
import { CertificationBreakdownTable } from '@/components/analytics/CertificationBreakdownTable'
import { CompletionGauge } from '@/components/dashboard/CompletionGauge'
import { Users, GraduationCap } from 'lucide-react'

export default function ReportsListPage() {
  const { data: groups, isLoading, error, refetch } = useCertificationAnalytics()

  if (isLoading) return <LoadingSpinner fullPage />
  if (error) return <ErrorState onRetry={refetch} />

  const allCerts = (groups ?? []).flatMap((g) => g.certifications)
  const totalStudents = allCerts.reduce((sum, c) => sum + c.totalStudents, 0)
  const totalDone = allCerts.reduce((sum, c) => sum + c.verified + c.completed, 0)
  const overallRate = totalStudents > 0 ? Math.round((totalDone / totalStudents) * 100) : 0
  const activeCertCount = new Set(allCerts.map((c) => c.opportunityId)).size

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certification Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of what each group is doing for certifications — placement drives are managed separately under Opportunities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stmary-primary/10">
              <Users className="h-4 w-4 text-stmary-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{groups?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <GraduationCap className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{activeCertCount}</p>
              <p className="text-xs text-muted-foreground">Certifications Posted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CompletionGauge value={overallRate} />
            <div>
              <p className="text-lg font-bold text-foreground">{overallRate}%</p>
              <p className="text-xs text-muted-foreground">Overall Completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {groupCompletionData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Completion by Group</h2>
            <p className="mb-3 text-xs text-muted-foreground">Verified + completed as a share of each group's enrollment</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={groupCompletionData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="reportsRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b82020" />
                    <stop offset="100%" stopColor="#8f1919" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" fill="url(#reportsRateGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <CertificationBreakdownTable groups={groups ?? []} />
    </div>
  )
}
