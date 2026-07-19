export interface OpportunityRound {
  id: string
  opportunityId: string
  title: string
  link: string | null
  scheduledAt: string | null
  notes: string
  sequence: number
  createdAt: string
  updatedAt: string
}

export interface RoundInput {
  title: string
  link?: string
  scheduledAt?: string
  notes?: string
}

export interface Opportunity {
  id: string
  title: string
  description: string
  applicationLink: string | null
  meetingLink: string | null
  opportunityType: string
  state: string
  createdBy: string
  opensAt: string | null
  closesAt: string | null
  isActive: boolean
  requireProof: boolean
  maxSubmissions: number | null
  allowGroupSubmission: boolean
  targetBranchId: string | null
  targetSectionId: string | null
  targetBatchId: string | null
  targetGroupId: string | null
  createdAt: string
  updatedAt: string
  rounds?: OpportunityRound[]
}

export interface CreateOpportunityDto {
  title: string
  description?: string
  applicationLink?: string
  meetingLink?: string
  opportunityType: string
  academicPeriodId: string
  opensAt?: string
  closesAt?: string
  requireProof?: boolean
  maxSubmissions?: number
  allowGroupSubmission?: boolean
  visibilityScope?: 'group' | 'section'
}

export interface UpdateOpportunityDto extends Partial<CreateOpportunityDto> {
  state?: string
}

export interface OpportunityFilter {
  page?: number
  limit?: number
  state?: string
  type?: string
  search?: string
}
