import client from './client'

export interface SectionDto {
  id: string
  code: string
  mentorUserId: string | null
  mentorName?: string
  branchName?: string
  academicPeriodName?: string
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
  // /sections is a paginated list endpoint ({ data, meta }), not a bare array —
  // returning the wrapper directly made every `sections?.[0]` lookup resolve to
  // undefined, so nothing that depends on "the current section" (Students page,
  // admin/mentor dashboards) ever found a sectionId to query with.
  const response = await client.get<{ data: SectionDto[] }>('/sections?limit=100')
  return response.data.data
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
