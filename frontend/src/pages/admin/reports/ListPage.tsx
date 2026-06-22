import { useQuery } from '@tanstack/react-query'
import * as sectionsApi from '@/api/sections.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsListPage() {
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.listSections(),
  })

  const sectionName = sections?.[0]?.code ?? 'Section'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Section-wise performance and certification reports
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Section Completion Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Overall certification completion metrics for {sectionName}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Group-wise Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Per-group certification completion and ranking
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Certification Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enrollment and completion data per certification opportunity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Student Readiness Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Individual student progress tracking and attention flags
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
