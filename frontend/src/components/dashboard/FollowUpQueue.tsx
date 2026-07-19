import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import type { FollowUpItem } from '@/types/dashboard'

interface FollowUpQueueProps {
  items: FollowUpItem[]
}

const statusStyles: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
}

export function FollowUpQueue({ items }: FollowUpQueueProps) {
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <h2 className="text-lg font-semibold mb-3">
        Follow-Up Queue
        {items.length > 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({items.length} need attention)
          </span>
        )}
      </h2>
      <div className="min-h-0 flex-1 rounded-md border">
        <div className="h-full overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Roll Number</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Certification</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Days Pending</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No pending follow-ups
                  </td>
                </tr>
              )}
              {items.map((item, idx) => (
                <tr
                  key={`${item.participationId}-${idx}`}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">{item.rollNumber}</td>
                  <td className="px-4 py-3 font-medium">{item.studentName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.groupName}</td>
                  <td className="px-4 py-3">{item.opportunityTitle}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${
                        statusStyles[item.status] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        item.daysPending > 14
                          ? 'font-semibold text-red-600'
                          : item.daysPending > 7
                            ? 'font-medium text-orange-600'
                            : 'text-muted-foreground'
                      }
                    >
                      {item.daysPending}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {items.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => navigate(ROUTES.ADMIN_VERIFICATIONS)}
        >
          View Full Queue
        </Button>
      )}
    </div>
  )
}
