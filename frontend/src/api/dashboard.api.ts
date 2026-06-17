import client from './client'
import type { AdminDashboard, MentorDashboard, TeamLeaderDashboard, StudentDashboard } from '@/types/dashboard'

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const response = await client.get<AdminDashboard>('/dashboard/admin')
  return response.data
}

export async function getMentorDashboard(): Promise<MentorDashboard> {
  const response = await client.get<MentorDashboard>('/dashboard/mentor')
  return response.data
}

export async function getTeamLeaderDashboard(): Promise<TeamLeaderDashboard> {
  const response = await client.get<TeamLeaderDashboard>('/dashboard/team-leader')
  return response.data
}

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const response = await client.get<StudentDashboard>('/dashboard/student')
  return response.data
}
