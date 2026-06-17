import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as dashboardApi from '@/api/dashboard.api'

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
}

export function useStudentDashboardData() {
  const { user } = useAuth()

  return useQuery<StudentDashboardData>({
    queryKey: ['dashboard', 'student', 'v2'],
    queryFn: async () => {
      const dashRes = await dashboardApi.getStudentDashboard()

      return {
        name: user?.name ?? 'Student',
        rollNumber: '',
        sectionName: '',
        groupName: '',
        summary: {
          assigned: dashRes.assignedOpportunities,
          inProgress: dashRes.inProgress,
          completed: dashRes.completed + dashRes.verified,
          pendingVerification: dashRes.submitted,
        },
      }
    },
    enabled: !!user,
  })
}
