import { StatCard } from './StatCard'
import { StatGrid } from './StatGrid'

interface SummaryCardsProps {
  totalStudents: number
  totalGroups: number
  activeOpportunities: number
  pendingFollowUps: number
}

export function SummaryCards({ totalStudents, totalGroups, activeOpportunities, pendingFollowUps }: SummaryCardsProps) {
  return (
    <StatGrid className="xl:grid-cols-4">
      <StatCard title="Total Students" value={totalStudents} />
      <StatCard title="Groups" value={totalGroups} />
      <StatCard title="Active Opportunities" value={activeOpportunities} />
      <StatCard title="Pending Follow-Ups" value={pendingFollowUps} />
    </StatGrid>
  )
}
