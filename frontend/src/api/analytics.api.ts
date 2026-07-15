import client from './client'
import type { GroupCertificationSummary } from '@/types/analytics'

export async function getCertificationBreakdown(): Promise<GroupCertificationSummary[]> {
  const response = await client.get<GroupCertificationSummary[]>('/analytics/certifications')
  return response.data
}
