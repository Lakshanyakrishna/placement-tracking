export interface Opportunity {
  id: string
  title: string
  description: string
  applicationLink: string | null
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
}

export interface CreateOpportunityDto {
  title: string
  description?: string
  applicationLink?: string
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
