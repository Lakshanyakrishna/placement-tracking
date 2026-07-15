import { useQuery } from '@tanstack/react-query'
import * as api from '@/api/academic-periods.api'

export function useAcademicPeriods() {
  return useQuery({
    queryKey: ['academic-periods'],
    queryFn: () => api.listAcademicPeriods(),
  })
}
