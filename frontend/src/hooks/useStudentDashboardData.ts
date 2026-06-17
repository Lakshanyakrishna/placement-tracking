import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as dashboardApi from '@/api/dashboard.api'
import * as participationsApi from '@/api/participations.api'
import * as sectionsApi from '@/api/sections.api'
import type { Participation } from '@/types/participation'

export interface CertificationRow {
  id: string
  opportunityId: string
  title: string
  assignedDate: string
  deadline: string | null
  status: string
  participationId: string | null
}

export interface RecentUpdate {
  type: string
  message: string
  date: string
}

export interface StudentDashboardData {
  name: string
  rollNumber: string
  sectionName: string
  groupName: string
  summary: {
    assigned: number
    inProgress: number
    completed: number
    pendingVerification: number
  }
  certifications: CertificationRow[]
  recentUpdates: RecentUpdate[]
}

export function useStudentDashboardData() {
  const { user } = useAuth()

  return useQuery<StudentDashboardData>({
    queryKey: ['dashboard', 'student', 'v2'],
    queryFn: async () => {
      const [dashRes, partsRes] = await Promise.all([
        dashboardApi.getStudentDashboard(),
        participationsApi.getMyParticipations(),
      ])

      const parts: Participation[] = partsRes.data ?? []

      const certifications: CertificationRow[] = parts.map((p) => ({
        id: p.id,
        opportunityId: p.opportunityId,
        title: p.opportunity?.title ?? p.opportunityTitle ?? 'Unknown',
        assignedDate: p.createdAt,
        deadline: p.opportunity?.closesAt ?? null,
        status: p.status,
        participationId: p.id,
      }))

      const recentUpdates: RecentUpdate[] = parts
        .slice()
        .sort((a, b) => {
          const da = a.verifiedAt ?? a.submittedAt ?? a.startedAt ?? a.createdAt
          const db = b.verifiedAt ?? b.submittedAt ?? b.startedAt ?? b.createdAt
          return new Date(db).getTime() - new Date(da).getTime()
        })
        .slice(0, 5)
        .map((p) => {
          const t = p.opportunity?.title ?? p.opportunityTitle ?? 'a certification'
          if (p.status === 'verified') {
            return { type: 'verified', message: `Certificate verified for ${t}`, date: p.verifiedAt ?? '' }
          }
          if (p.status === 'submitted') {
            return { type: 'submitted', message: `Submitted ${t} for verification`, date: p.submittedAt ?? '' }
          }
          if (p.status === 'in_progress') {
            return { type: 'started', message: `Started working on ${t}`, date: p.startedAt ?? p.createdAt }
          }
          return { type: 'assigned', message: `${t} assigned`, date: p.createdAt }
        })

      return {
        name: user?.name ?? 'Student',
        rollNumber: '',
        sectionName: 'IV-AI&DS-A',
        groupName: '',
        summary: {
          assigned: dashRes.assignedOpportunities,
          inProgress: dashRes.inProgress,
          completed: dashRes.completed + dashRes.verified,
          pendingVerification: dashRes.submitted,
        },
        certifications,
        recentUpdates,
      }
    },
    enabled: !!user,
  })
}
