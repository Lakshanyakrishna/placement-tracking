import client from './client'
import type { Opportunity, CreateOpportunityDto, UpdateOpportunityDto, OpportunityFilter } from '@/types/opportunity'
import type { PaginatedResponse } from '@/types/common'

export async function listOpportunities(filter?: OpportunityFilter): Promise<PaginatedResponse<Opportunity>> {
  const response = await client.get<PaginatedResponse<Opportunity>>('/opportunities', { params: filter })
  return response.data
}

export async function getOpportunity(id: string): Promise<Opportunity> {
  const response = await client.get<Opportunity>(`/opportunities/${id}`)
  return response.data
}

export async function createOpportunity(dto: CreateOpportunityDto): Promise<Opportunity> {
  const response = await client.post<Opportunity>('/opportunities', dto)
  return response.data
}

export async function updateOpportunity(id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
  const response = await client.patch<Opportunity>(`/opportunities/${id}`, dto)
  return response.data
}

export async function deleteOpportunity(id: string): Promise<void> {
  await client.delete(`/opportunities/${id}`)
}

export async function publishOpportunity(id: string): Promise<Opportunity> {
  const response = await client.post<Opportunity>(`/opportunities/${id}/publish`)
  return response.data
}

export async function archiveOpportunity(id: string): Promise<Opportunity> {
  const response = await client.post<Opportunity>(`/opportunities/${id}/archive`)
  return response.data
}
