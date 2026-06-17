import type { CertHeatmapCell } from '@/types/dashboard'

interface CertHeatmapRow {
  oppTitle: string
  groups: Record<string, CertHeatmapCell>
}

interface CertHeatmapProps {
  rows: CertHeatmapRow[]
  groupNames: string[]
}

function heatColor(pct: number): string {
  if (pct >= 80) return 'bg-green-600 text-white'
  if (pct >= 60) return 'bg-green-400 text-white'
  if (pct >= 40) return 'bg-yellow-300 text-black'
  if (pct >= 20) return 'bg-orange-200 text-black'
  if (pct > 0) return 'bg-red-100 text-black'
  return 'bg-gray-100 text-muted-foreground'
}

export function CertHeatmap({ rows, groupNames }: CertHeatmapProps) {
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Certification Heatmap</h2>
        <p className="text-sm text-muted-foreground">No certification data available</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Certification Heatmap</h2>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Certification
              </th>
              {groupNames.map((gn) => (
                <th
                  key={gn}
                  className="px-4 py-3 text-center font-medium text-muted-foreground"
                >
                  {gn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.oppTitle} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{row.oppTitle}</td>
                {groupNames.map((gn) => {
                  const cell = row.groups[gn]
                  const pct = cell && cell.assigned > 0
                    ? Math.round((cell.completed / cell.assigned) * 100)
                    : 0
                  return (
                    <td key={gn} className="px-4 py-3 text-center">
                      <span
                        className={`inline-block min-w-[80px] rounded px-2 py-1 text-xs font-medium ${heatColor(pct)}`}
                      >
                        {cell ? `${cell.completed} / ${cell.assigned}` : '—'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
