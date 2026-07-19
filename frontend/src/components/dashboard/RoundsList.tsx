import { ExternalLink, Calendar } from 'lucide-react'
import type { OpportunityRound } from '@/types/opportunity'

interface RoundsListProps {
  rounds: OpportunityRound[]
}

function formatSchedule(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null
  return new Date(scheduledAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RoundsList({ rounds }: RoundsListProps) {
  if (rounds.length === 0) return null

  const sorted = [...rounds].sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="mb-3 space-y-1.5 rounded-md border border-dashed p-2">
      {sorted.map((round) => {
        const schedule = formatSchedule(round.scheduledAt)
        return (
          <div key={round.id} className="flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-medium text-[#111827]">{round.title}</p>
              {schedule && (
                <p className="flex items-center gap-1 text-[#6B7280]">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {schedule}
                </p>
              )}
            </div>
            {round.link && (
              <a
                href={round.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 rounded bg-stmary-primary/10 px-2 py-1 font-medium text-stmary-primary hover:bg-stmary-primary/20"
              >
                <ExternalLink className="h-3 w-3" />
                Join
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
