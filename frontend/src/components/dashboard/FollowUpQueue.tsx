import { Button } from '@/components/ui/button'
import type { FollowUpItem } from '@/types/dashboard'

interface FollowUpQueueProps {
  items: FollowUpItem[]
}

const statusStyles: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
}

export function FollowUpQueue({ items }: FollowUpQueueProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">
        Follow-Up Queue
        {items.length > 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({items.length} need attention)
          </span>
        )}
      </h2>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Roll Number</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Certification</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Days Pending</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-orange-600"
                    >
                      Follow Up
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-green-600"
                    >
                      Verify
                    </Button>
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
