import { useQuery } from '@tanstack/react-query'
import * as dashboardApi from '@/api/dashboard.api'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants'

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: dashboardApi.getAdminDashboard,
    enabled: useAuth().user?.roles.includes(ROLES.ADMIN) ?? false,
  })
}

export function useMentorDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'mentor'],
    queryFn: dashboardApi.getMentorDashboard,
  })
}

export function useTeamLeaderDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'team-leader'],
    queryFn: dashboardApi.getTeamLeaderDashboard,
  })
}

export function useStudentDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: dashboardApi.getStudentDashboard,
  })
}
