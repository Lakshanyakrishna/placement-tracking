import { cn } from '@/lib/utils'

const STAGES = ['not_started', 'in_progress', 'submitted', 'verified'] as const
const HEIGHTS = ['h-1', 'h-2', 'h-3', 'h-4']

function stageIndex(status: string): number {
  if (status === 'completed') return 3
  if (status === 'rejected') return 2
  const idx = (STAGES as readonly string[]).indexOf(status)
  return idx === -1 ? 0 : idx
}

interface CareerPathTrailProps {
  status: string
  className?: string
}

/** A small ascending staircase of bars — the certification's stage in a
 * student's career journey, rendered as a literal upward trajectory rather
 * than a flat pill. Fills up to the current stage in the brand gradient;
 * a rejection breaks the climb in red at the stage it was flagged. */
export function CareerPathTrail({ status, className }: CareerPathTrailProps) {
  const current = stageIndex(status)
  const isRejected = status === 'rejected'

  return (
    <div className={cn('flex items-end gap-1', className)} title="Career progress">
      {STAGES.map((stage, i) => {
        const reached = i <= current
        return (
          <div
            key={stage}
            className={cn(
              'flex-1 rounded-t-sm transition-colors',
              HEIGHTS[i],
              reached ? (isRejected && i === current ? 'bg-red-400' : 'bg-stmary-gradient') : 'bg-gray-200',
            )}
          />
        )
      })}
    </div>
  )
}
