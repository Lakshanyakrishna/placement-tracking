import client from './client'
import type { Participation, UpdateParticipationStatusDto, ParticipationFilter } from '@/types/participation'
import type { PaginatedResponse } from '@/types/common'

export async function listParticipations(filter?: ParticipationFilter): Promise<PaginatedResponse<Participation>> {
  const response = await client.get<PaginatedResponse<Participation>>('/participations', { params: filter })
  return response.data
}

export async function getParticipation(id: string): Promise<Participation> {
  const response = await client.get<Participation>(`/participations/${id}`)
  return response.data
}

export async function createParticipation(dto: { opportunityId: string }): Promise<Participation> {
  const response = await client.post<Participation>('/participations', dto)
  return response.data
}

export async function updateParticipationStatus(id: string, dto: UpdateParticipationStatusDto): Promise<Participation> {
  const response = await client.patch<Participation>(`/participations/${id}/status`, dto)
  return response.data
}

export async function getMyParticipations(): Promise<PaginatedResponse<Participation>> {
  const response = await client.get<PaginatedResponse<Participation>>('/participations/me?limit=100')
  return response.data
}

export async function getGroupParticipations(groupId: string): Promise<PaginatedResponse<Participation>> {
  // limit is capped at 100 by the shared PaginationQueryDto backend-wide — a higher
  // value here 400s on every call, which the admin dashboard's .catch() silently
  // swallowed into an empty array, making Group Performance/Cert Completion always
  // show 0 regardless of real data.
  const response = await client.get<PaginatedResponse<Participation>>(`/participations/group/${groupId}?limit=100`)
  return response.data
}

export async function getSectionParticipations(sectionId: string): Promise<PaginatedResponse<Participation>> {
  const response = await client.get<PaginatedResponse<Participation>>(`/participations/section/${sectionId}?limit=100`)
  return response.data
}
