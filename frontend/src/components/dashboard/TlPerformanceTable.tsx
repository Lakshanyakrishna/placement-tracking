import type { TlPerformanceRow } from '@/types/dashboard'

interface TlPerformanceTableProps {
  rows: TlPerformanceRow[]
}

export function TlPerformanceTable({ rows }: TlPerformanceTableProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Team Leader Performance</h2>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Team Leader</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Completion %</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Follow-Up Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No team leaders assigned
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.tlId} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{row.tlName}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.groupName}</td>
                <td className="px-4 py-3 text-right">
                  <span className={row.completionPct >= 50 ? 'text-green-600' : 'text-amber-600'}>
                    {row.completionPct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={row.followUpCount > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                    {row.followUpCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
