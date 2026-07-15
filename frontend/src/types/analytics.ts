export interface CertificationOpportunityBreakdown {
  opportunityId: string
  title: string
  opportunityType: string
  state: string
  totalStudents: number
  notStarted: number
  inProgress: number
  submitted: number
  verified: number
  completed: number
  rejected: number
  completionRate: number
}

export interface GroupCertificationSummary {
  groupId: string
  groupName: string
  teamLeaderName: string | null
  certifications: CertificationOpportunityBreakdown[]
}
