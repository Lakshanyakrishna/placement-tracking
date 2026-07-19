export interface AdminDashboard {
  totalStudents: number
  totalOpportunities: number
  activeOpportunities: number
  participations: number
  submitted: number
  verified: number
  rejected: number
  completionRate: number
}

export interface MentorDashboard {
  assignedSections: number
  totalStudents: number
  opportunitiesActive: number
  submitted: number
  verified: number
  rejected: number
  completionRate: number
  followUpQueue: FollowUpItem[]
}

export interface TeamLeaderDashboard {
  assignedGroups: number
  students: number
  pendingVerifications: number
  verified: number
  rejected: number
}

export interface StudentDashboard {
  assignedOpportunities: number
  inProgress: number
  submitted: number
  verified: number
  completed: number
  availableOpportunities: number
  rejected: number
}

export interface GroupPerformanceRow {
  groupId: string
  groupName: string
  sectionCode: string
  students: number
  completed: number
  inProgress: number
  notStarted: number
  completionPct: number
}

export interface TlPerformanceRow {
  tlId: string
  tlName: string
  groupName: string
  groupId: string
  completionPct: number
  followUpCount: number
}

export interface OpportunityStatsRow {
  opportunityId: string
  title: string
  type: string
  postedDate: string | null
  assigned: number
  started: number
  completed: number
}

export interface CertHeatmapCell {
  completed: number
  assigned: number
}

export type CertHeatmapRow = Record<string, CertHeatmapCell>

export interface AtRiskStudent {
  rollNumber: string
  studentName: string
  groupName: string
  certification: string
  status: string
  lastActivity: string | null
}

export interface FollowUpItem {
  rollNumber: string
  studentName: string
  groupName: string
  opportunityTitle: string
  status: string
  participationId: string
  submittedAt: string | null
  daysPending: number
}

export interface GroupRankingEntry {
  groupId: string
  groupName: string
  completionPct: number
  rank: number
}

export interface GroupParticipationDetail {
  studentName: string
  rollNumber: string
  opportunityTitle: string
  status: string
}

export interface AdminDashboardData {
  summary: {
    totalStudents: number
    totalGroups: number
    activeOpportunities: number
    pendingFollowUps: number
    totalCertifications: number
  }
  certificationStats: OpportunityStatsRow[]
  groupPerformance: GroupPerformanceRow[]
  groupRanking: GroupRankingEntry[]
  certHeatmap: { oppTitle: string; groups: Record<string, CertHeatmapCell> }[]
  atRiskStudents: AtRiskStudent[]
  followUpQueue: FollowUpItem[]
  groupDetails: Record<string, GroupParticipationDetail[]>
}
