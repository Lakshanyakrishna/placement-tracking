import type { OpportunityStatsRow } from '@/types/dashboard'

interface OpportunityStatsTableProps {
  rows: OpportunityStatsRow[]
}

export function OpportunityStatsTable({ rows }: OpportunityStatsTableProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Certification Opportunities</h2>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Certification Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Posted Date
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Assigned Students
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Started
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Completed
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Completion %
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No certification opportunities found
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const pct =
                row.assigned > 0
                  ? Math.round((row.completed / row.assigned) * 100)
                  : 0
              return (
                <tr
                  key={row.opportunityId}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.postedDate
                      ? new Date(row.postedDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">{row.assigned}</td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {row.started}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {row.completed}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 80
                              ? 'bg-green-500'
                              : pct >= 60
                                ? 'bg-blue-500'
                                : pct >= 40
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
