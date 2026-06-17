import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GroupPerformanceRow } from '@/types/dashboard'

interface GroupPerformanceCardsProps {
  rows: GroupPerformanceRow[]
}

function progressColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 60) return 'bg-blue-500'
  if (pct >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function barColor(pct: number): string {
  if (pct >= 80) return 'bg-green-100'
  if (pct >= 60) return 'bg-blue-100'
  if (pct >= 40) return 'bg-orange-100'
  return 'bg-red-100'
}

export function GroupPerformanceCards({ rows }: GroupPerformanceCardsProps) {
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Group Performance</h2>
        <p className="text-sm text-muted-foreground">No group data available</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Group Performance</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <Card key={row.groupId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{row.groupName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                {row.students} Student{row.students !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                <div className={`h-2.5 w-full rounded-full ${barColor(row.completionPct)}`}>
                  <div
                    className={`h-2.5 rounded-full ${progressColor(row.completionPct)} transition-all`}
                    style={{ width: `${row.completionPct}%` }}
                  />
                </div>
                <p className={`text-sm font-semibold ${
                  row.completionPct >= 80 ? 'text-green-600' :
                  row.completionPct >= 60 ? 'text-blue-600' :
                  row.completionPct >= 40 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {row.completionPct}%
                </p>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">{row.completed} done</span>
                <span className="text-blue-600 font-medium">{row.inProgress} active</span>
                <span>{row.notStarted} left</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
