import client from './client'

export interface GroupDetailDto {
  id: string
  sectionId: string
  name: string
  teamLeaderUserId: string | null
  teamLeaderName?: string
  sectionCode?: string
  sectionName?: string
}

export interface GroupStudentDto {
  id: string
  name: string
  email: string
  rollNumber: string | null
}

export async function listGroups(): Promise<GroupDetailDto[]> {
  const response = await client.get<{ data: GroupDetailDto[] }>('/groups?limit=100')
  return response.data.data
}

export async function getGroupStudents(groupId: string): Promise<GroupStudentDto[]> {
  const response = await client.get<GroupStudentDto[]>(`/groups/${groupId}/students`)
  return response.data
}
