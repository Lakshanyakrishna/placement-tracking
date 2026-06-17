import client from './client'
import type { PendingSubmission, VerificationLog, RejectSubmissionDto } from '@/types/verification'
import type { PaginatedResponse } from '@/types/common'

export async function getPendingVerifications(): Promise<PendingSubmission[]> {
  const response = await client.get<PendingSubmission[]>('/verifications/pending')
  return response.data
}

export async function approveSubmission(submissionId: string): Promise<VerificationLog> {
  const response = await client.post<VerificationLog>(`/verifications/${submissionId}/approve`)
  return response.data
}

export async function rejectSubmission(submissionId: string, dto: RejectSubmissionDto): Promise<VerificationLog> {
  const response = await client.post<VerificationLog>(`/verifications/${submissionId}/reject`, dto)
  return response.data
}

export async function getVerificationsByGroup(groupId: string): Promise<PaginatedResponse<VerificationLog>> {
  const response = await client.get<PaginatedResponse<VerificationLog>>(`/verifications/group/${groupId}`)
  return response.data
}

export async function getVerificationsBySection(sectionId: string): Promise<PaginatedResponse<VerificationLog>> {
  const response = await client.get<PaginatedResponse<VerificationLog>>(`/verifications/section/${sectionId}`)
  return response.data
}
