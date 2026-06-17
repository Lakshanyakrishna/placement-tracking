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
  const response = await client.get<PaginatedResponse<Participation>>(`/participations/group/${groupId}?limit=500`)
  return response.data
}

export async function getSectionParticipations(sectionId: string): Promise<PaginatedResponse<Participation>> {
  const response = await client.get<PaginatedResponse<Participation>>(`/participations/section/${sectionId}?limit=500`)
  return response.data
}
