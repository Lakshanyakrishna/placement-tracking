import { Badge } from '@/components/ui/badge'
import type { AtRiskStudent } from '@/types/dashboard'

interface StudentsRequiringAttentionProps {
  students: AtRiskStudent[]
}

export function StudentsRequiringAttention({ students }: StudentsRequiringAttentionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Students Requiring Attention</h2>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Roll Number</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Certification</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No students requiring attention
                </td>
              </tr>
            )}
            {students.map((s, idx) => (
              <tr
                key={`${s.rollNumber}-${s.certification}-${idx}`}
                className="border-b last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-mono text-xs">{s.rollNumber}</td>
                <td className="px-4 py-3 font-medium">{s.studentName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.groupName}</td>
                <td className="px-4 py-3">{s.certification}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    {s.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {s.lastActivity
                    ? new Date(s.lastActivity).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
