import { useQuery } from '@tanstack/react-query'
import * as dashboardApi from '@/api/dashboard.api'
import * as groupsApi from '@/api/groups.api'
import * as participationsApi from '@/api/participations.api'
import * as opportunitiesApi from '@/api/opportunities.api'
import * as sectionsApi from '@/api/sections.api'
import type {
  AdminDashboardData,
  GroupPerformanceRow,
  OpportunityStatsRow,
  CertHeatmapCell,
  AtRiskStudent,
  FollowUpItem,
  GroupRankingEntry,
} from '@/types/dashboard'
import type { Participation } from '@/types/participation'

function completionPct(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

interface GroupParticipationData {
  groupId: string
  groupName: string
  sectionCode: string
  participations: Participation[]
  studentCount: number
  tlName: string
}

export function useAdminDashboardData() {
  return useQuery<AdminDashboardData>({
    queryKey: ['dashboard', 'admin', 'v2'],
    queryFn: async () => {
      const [dashboard, groups, sections, opportunitiesRes] = await Promise.all([
        dashboardApi.getAdminDashboard(),
        groupsApi.listGroups(),
        sectionsApi.listSections(),
        opportunitiesApi.listOpportunities(),
      ])
      const opportunities = opportunitiesRes.data

      const sectionId = sections.length > 0 ? sections[0].id : null

      const [sectionStudents] = await Promise.all([
        sectionId
          ? sectionsApi.getSectionStudents(sectionId).catch(() => [])
          : Promise.resolve([] as sectionsApi.StudentDto[]),
      ])

      const groupDataPromises = groups.map(async (g) => {
        const [partsRes, students] = await Promise.all([
          participationsApi
            .getGroupParticipations(g.id)
            .then((res) => res.data)
            .catch(() => [] as Participation[]),
          groupsApi
            .getGroupStudents(g.id)
            .then((s) => s.length)
            .catch(() => 0),
        ])
        return {
          groupId: g.id,
          groupName: g.name,
          sectionCode: g.sectionCode ?? '',
          tlUserId: g.teamLeaderUserId,
          tlName: g.teamLeaderName ?? 'Unassigned',
          studentCount: students,
          participations: partsRes,
        }
      })

      const groupData: GroupParticipationData[] = await Promise.all(groupDataPromises)

      // ── Group Performance ──
      const groupPerformance: GroupPerformanceRow[] = groupData.map((gd) => {
        const completed = gd.participations.filter(
          (p) => p.status === 'verified' || p.status === 'completed',
        ).length
        const inProgress = gd.participations.filter(
          (p) => p.status === 'in_progress' || p.status === 'submitted',
        ).length
        const notStarted = gd.participations.filter((p) => p.status === 'not_started').length
        const total = gd.participations.length
        return {
          groupId: gd.groupId,
          groupName: gd.groupName,
          sectionCode: gd.sectionCode,
          students: gd.studentCount,
          completed,
          inProgress,
          notStarted,
          completionPct: completionPct(completed, total),
        }
      })

      // ── Group Ranking ──
      const groupRanking: GroupRankingEntry[] = [...groupPerformance]
        .sort((a, b) => b.completionPct - a.completionPct)
        .map((gp, i) => ({
          groupId: gp.groupId,
          groupName: gp.groupName,
          completionPct: gp.completionPct,
          rank: i + 1,
        }))

      // ── All participations with group context ──
      const allParticipations = groupData.flatMap((gd) =>
        gd.participations.map((p) => ({ ...p, _groupName: gd.groupName, _groupId: gd.groupId })),
      )

      // ── Certification Stats ──
      const oppMap = new Map<
        string,
        { assigned: number; started: number; completed: number }
      >()
      for (const p of allParticipations) {
        const entry = oppMap.get(p.opportunityId) ?? {
          assigned: 0,
          started: 0,
          completed: 0,
        }
        entry.assigned++
        if (
          p.status === 'in_progress' ||
          p.status === 'submitted' ||
          p.status === 'verified' ||
          p.status === 'completed'
        ) {
          entry.started++
        }
        if (p.status === 'verified' || p.status === 'completed') {
          entry.completed++
        }
        oppMap.set(p.opportunityId, entry)
      }

      const certificationStats: OpportunityStatsRow[] = opportunities
        .filter((opp) => opp.opportunityType === 'training')
        .map((opp) => {
          const stats = oppMap.get(opp.id) ?? {
            assigned: 0,
            started: 0,
            completed: 0,
          }
          return {
            opportunityId: opp.id,
            title: opp.title,
            type: opp.opportunityType,
            postedDate: opp.createdAt,
            ...stats,
          }
        })

      // ── Certification Heatmap ──
      const trainingOpps = opportunities.filter((opp) => opp.opportunityType === 'training')
      const certHeatmap = trainingOpps.map((opp) => {
        const groups: Record<string, CertHeatmapCell> = {}
        for (const gd of groupData) {
          const groupParts = gd.participations.filter((p) => p.opportunityId === opp.id)
          const assigned = groupParts.length
          const completed = groupParts.filter(
            (p) => p.status === 'verified' || p.status === 'completed',
          ).length
          groups[gd.groupName] = { completed, assigned }
        }
        return { oppTitle: opp.title, groups }
      })

      // ── At-Risk Students ──
      const atRiskStudents: AtRiskStudent[] = allParticipations
        .filter((p) => p.status === 'not_started')
        .map((p) => {
          const student = sectionStudents.find((s) => s.id === (p as any).enrollmentUserId)
          return {
            rollNumber: student?.rollNumber ?? (p as any).enrollmentRollNumber ?? '—',
            studentName: p.userName ?? 'Unknown',
            groupName: (p as any)._groupName ?? '—',
            certification: p.opportunity?.title ?? p.opportunityTitle ?? '—',
            status: p.status,
            lastActivity: p.createdAt,
          }
        })
        .slice(0, 20)

      // ── Follow-Up Queue ──
      const followUpQueue: FollowUpItem[] = allParticipations
        .filter((p) => p.status === 'submitted' || p.status === 'in_progress')
        .map((p) => {
          const student = sectionStudents.find((s) => s.id === (p as any).enrollmentUserId)
          return {
            rollNumber: student?.rollNumber ?? (p as any).enrollmentRollNumber ?? '—',
            studentName: p.userName ?? 'Unknown',
            groupName: (p as any)._groupName ?? '—',
            opportunityTitle: p.opportunity?.title ?? p.opportunityTitle ?? '—',
            status: p.status,
            participationId: p.id,
            submittedAt: p.submittedAt,
            daysPending: daysSince(p.submittedAt),
          }
        })
        .sort((a, b) => b.daysPending - a.daysPending)
        .slice(0, 20)

      const pendingFollowUps = followUpQueue.length

      return {
        summary: {
          totalStudents: dashboard.totalStudents,
          totalGroups: groups.length,
          activeOpportunities: dashboard.activeOpportunities,
          pendingFollowUps,
          totalCertifications: certificationStats.length,
        },
        certificationStats,
        groupPerformance,
        groupRanking,
        certHeatmap,
        atRiskStudents,
        followUpQueue,
      }
    },
  })
}
