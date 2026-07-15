import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText } from 'lucide-react'
import type { GroupCertificationSummary } from '@/types/analytics'

const stateColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-blue-100 text-blue-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
}

function completionColor(rate: number): string {
  if (rate >= 75) return 'bg-emerald-500'
  if (rate >= 40) return 'bg-yellow-500'
  if (rate > 0) return 'bg-orange-500'
  return 'bg-gray-300'
}

function groupCompletionRate(group: GroupCertificationSummary): number {
  const totals = group.certifications.reduce(
    (acc, c) => ({ done: acc.done + c.verified + c.completed, total: acc.total + c.totalStudents }),
    { done: 0, total: 0 },
  )
  return totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0
}

export function CertificationBreakdownTable({ groups }: { groups: GroupCertificationSummary[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
        <FileText className="mx-auto h-8 w-8 mb-2 text-muted-foreground/40" />
        No certifications posted by any group yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const overallRate = groupCompletionRate(group)
        return (
          <Card key={group.groupId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{group.groupName}</h3>
                {group.teamLeaderName && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Team Leader: {group.teamLeaderName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Overall</span>
                <span className="text-sm font-bold text-foreground">{overallRate}%</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {group.certifications.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No certifications posted yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Certification</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">State</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Students</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Verified</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Submitted</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">In Progress</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Rejected</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground w-32">Completion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.certifications.map((cert) => (
                        <tr key={cert.opportunityId} className="border-b last:border-0">
                          <td className="px-3 py-2.5 font-medium text-foreground">{cert.title}</td>
                          <td className="px-3 py-2.5">
                            <Badge className={stateColors[cert.state] ?? 'bg-gray-100 text-gray-800'}>{cert.state}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">{cert.totalStudents}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-700">{cert.verified + cert.completed}</td>
                          <td className="px-3 py-2.5 text-right text-yellow-700">{cert.submitted}</td>
                          <td className="px-3 py-2.5 text-right text-blue-700">{cert.inProgress}</td>
                          <td className="px-3 py-2.5 text-right text-red-700">{cert.rejected}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full ${completionColor(cert.completionRate)}`}
                                  style={{ width: `${cert.completionRate}%` }}
                                />
                              </div>
                              <span className="w-9 shrink-0 text-xs font-medium text-muted-foreground">{cert.completionRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
