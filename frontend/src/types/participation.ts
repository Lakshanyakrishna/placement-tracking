export interface Participation {
  id: string
  opportunityId: string
  enrollmentId: string
  status: string
  teamLeaderUserId: string | null
  startedAt: string | null
  submittedAt: string | null
  verifiedAt: string | null
  verifiedBy: string | null
  notes: string | null
  opportunity?: { title: string; opportunityType: string; closesAt?: string; opensAt?: string }
  enrollment?: { user?: { name: string; email: string } }
  createdAt: string
  updatedAt?: string
  opportunityTitle?: string
  opportunityType?: string
  enrollmentUserId?: string
  enrollmentRollNumber?: string | null
  userName?: string
  userEmail?: string
}

export interface UpdateParticipationStatusDto {
  status: string
}

export interface ParticipationFilter {
  page?: number
  limit?: number
  status?: string
  opportunityId?: string
}

export interface GroupRegistration {
  groupId: string
  groupName: string
  teamLeaderName: string | null
  registeredCount: number
  statusBreakdown: Record<string, number>
}

export interface OpportunityAnalytics {
  opportunityId: string
  opportunityTitle: string
  totalRegistered: number
  groups: GroupRegistration[]
}
