import type { GroupPerformanceRow } from '@/types/dashboard'

interface GroupPerformanceTableProps {
  rows: GroupPerformanceRow[]
}

export function GroupPerformanceTable({ rows }: GroupPerformanceTableProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Group Performance</h2>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Section</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Students</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Completed</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">In Progress</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Not Started</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Completion %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No groups found
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.groupId} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3">{row.sectionCode}</td>
                <td className="px-4 py-3 font-medium">{row.groupName}</td>
                <td className="px-4 py-3 text-right">{row.students}</td>
                <td className="px-4 py-3 text-right text-green-600">{row.completed}</td>
                <td className="px-4 py-3 text-right text-blue-600">{row.inProgress}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{row.notStarted}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${row.completionPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{row.completionPct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
