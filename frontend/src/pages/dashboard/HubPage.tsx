import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Users, LayoutDashboard, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMentorDashboard, useTeamLeaderDashboard } from '@/hooks/useDashboard'
import { useStudentDashboardData } from '@/hooks/useStudentDashboardData'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber'
import { ROLES, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface HubTileProps {
  title: string
  description: string
  icon: React.ReactNode
  accent: string
  topBar: string
  stats: { label: string; value: number }[]
  onClick: () => void
}

function HubTile({ title, description, icon, accent, topBar, stats, onClick }: HubTileProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', topBar)} />
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accent)}>{icon}</div>
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
          <p className="text-xs text-[#6B7280]">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-1 items-end gap-6">
        {stats.map((s) => (
          <div key={s.label}>
            <AnimatedNumber value={s.value} className="text-xl font-bold text-[#111827]" />
            <p className="text-xs text-[#6B7280]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-stmary-primary opacity-0 transition-opacity group-hover:opacity-100">
        View full dashboard <ArrowRight className="h-3 w-3" />
      </div>
    </button>
  )
}

export default function DashboardHubPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const isMentor = user?.roles.includes(ROLES.MENTOR) ?? false
  const isTeamLeader = user?.roles.includes(ROLES.TEAM_LEADER) ?? false
  const isStudent = user?.isStudent ?? false

  const mentorQuery = useMentorDashboard()
  const teamLeaderQuery = useTeamLeaderDashboard()
  const studentQuery = useStudentDashboardData()

  const stillLoading =
    (isMentor && mentorQuery.isLoading) ||
    (isTeamLeader && teamLeaderQuery.isLoading) ||
    (isStudent && studentQuery.isLoading)

  if (stillLoading) return <LoadingSpinner fullPage />

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={user?.name ?? ''}
        subtitle="Pick a dashboard to view"
        icon={<LayoutDashboard className="h-6 w-6 text-white" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isMentor && mentorQuery.data && (
          <HubTile
            title="Mentor Dashboard"
            description="Your section's performance"
            icon={<ShieldCheck className="h-5 w-5 text-stmary-primary" />}
            accent="bg-stmary-primary/10"
            topBar="bg-stmary-gradient"
            stats={[
              { label: 'Students', value: mentorQuery.data.totalStudents },
              { label: 'Completion', value: mentorQuery.data.completionRate },
            ]}
            onClick={() => navigate(ROUTES.MENTOR_DASHBOARD)}
          />
        )}

        {isTeamLeader && teamLeaderQuery.data && (
          <HubTile
            title="Team Leader Dashboard"
            description="Your groups and pending verifications"
            icon={<Users className="h-5 w-5 text-amber-600" />}
            accent="bg-amber-50"
            topBar="bg-amber-400"
            stats={[
              { label: 'Groups', value: teamLeaderQuery.data.assignedGroups },
              { label: 'Pending', value: teamLeaderQuery.data.pendingVerifications },
            ]}
            onClick={() => navigate(ROUTES.TEAM_LEADER_DASHBOARD)}
          />
        )}

        {isStudent && studentQuery.data && (
          <HubTile
            title="My Dashboard"
            description="Your own certifications and placements"
            icon={<LayoutDashboard className="h-5 w-5 text-slate-600" />}
            accent="bg-slate-100"
            topBar="bg-slate-400"
            stats={[
              { label: 'Assigned', value: studentQuery.data.summary.assigned },
              { label: 'Verified', value: studentQuery.data.summary.completed },
            ]}
            onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)}
          />
        )}
      </div>
    </div>
  )
}
