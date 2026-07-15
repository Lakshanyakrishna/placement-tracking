import { useQuery } from '@tanstack/react-query'
import * as api from '@/api/analytics.api'

export function useCertificationAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'certifications'],
    queryFn: () => api.getCertificationBreakdown(),
  })
}
