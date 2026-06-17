import type { GroupRankingEntry } from '@/types/dashboard'

interface GroupRankingProps {
  entries: GroupRankingEntry[]
}

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

const RANK_COLORS = [
  'border-yellow-400 bg-yellow-50',
  'border-gray-400 bg-gray-50',
  'border-orange-400 bg-orange-50',
  'border-slate-300 bg-slate-50',
  'border-slate-200 bg-slate-50',
]

export function GroupRanking({ entries }: GroupRankingProps) {
  if (entries.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Top Performing Groups</h2>
        <p className="text-sm text-muted-foreground">No data to rank</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Top Performing Groups</h2>
      <div className="space-y-2">
        {entries.map((entry) => {
          const idx = Math.min(entry.rank - 1, RANK_EMOJIS.length - 1)
          return (
            <div
              key={entry.groupId}
              className={`flex items-center justify-between rounded-lg border-2 p-3 ${RANK_COLORS[idx] ?? 'border-slate-200 bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{RANK_EMOJIS[idx] ?? `${entry.rank}.`}</span>
                <span className="font-semibold">{entry.groupName}</span>
              </div>
              <span className="text-sm font-bold">{entry.completionPct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
