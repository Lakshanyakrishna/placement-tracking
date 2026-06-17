import client from './client'

export interface SectionDto {
  id: string
  code: string
  name?: string
  isActive: boolean
  mentorUserId: string | null
  mentorName?: string
  createdAt: string
  updatedAt: string
}

export interface GroupDto {
  id: string
  sectionId: string
  name: string
  teamLeaderUserId: string | null
}

export interface StudentDto {
  id: string
  name: string
  email: string
  rollNumber: string | null
}

export async function listSections(): Promise<SectionDto[]> {
  const response = await client.get<SectionDto[]>('/sections')
  return response.data
}

export async function getSection(id: string): Promise<SectionDto> {
  const response = await client.get<SectionDto>(`/sections/${id}`)
  return response.data
}

export async function getSectionGroups(sectionId: string): Promise<GroupDto[]> {
  const response = await client.get<GroupDto[]>(`/sections/${sectionId}/groups`)
  return response.data
}

export async function getSectionStudents(sectionId: string): Promise<StudentDto[]> {
  const response = await client.get<StudentDto[]>(`/sections/${sectionId}/students`)
  return response.data
}
