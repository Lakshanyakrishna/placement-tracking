import { useCertificationAnalytics } from '@/hooks/useAnalytics'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card, CardContent } from '@/components/ui/card'
import { CertificationBreakdownTable } from '@/components/analytics/CertificationBreakdownTable'
import { Users, CheckCircle2, GraduationCap } from 'lucide-react'

export default function ReportsListPage() {
  const { data: groups, isLoading, error, refetch } = useCertificationAnalytics()

  if (isLoading) return <LoadingSpinner fullPage />
  if (error) return <ErrorState onRetry={refetch} />

  const allCerts = (groups ?? []).flatMap((g) => g.certifications)
  const totalStudents = allCerts.reduce((sum, c) => sum + c.totalStudents, 0)
  const totalDone = allCerts.reduce((sum, c) => sum + c.verified + c.completed, 0)
  const overallRate = totalStudents > 0 ? Math.round((totalDone / totalStudents) * 100) : 0
  const activeCertCount = new Set(allCerts.map((c) => c.opportunityId)).size

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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{groups?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{activeCertCount}</p>
              <p className="text-xs text-muted-foreground">Certifications Posted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{overallRate}%</p>
              <p className="text-xs text-muted-foreground">Overall Completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CertificationBreakdownTable groups={groups ?? []} />
    </div>
  )
}
