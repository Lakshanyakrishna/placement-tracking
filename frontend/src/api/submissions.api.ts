import client from './client'
import type { Submission } from '@/types/submission'

export async function getSubmissionsByParticipation(participationId: string): Promise<Submission[]> {
  const response = await client.get<Submission[]>(`/submissions/participation/${participationId}`)
  return response.data
}

export async function createSubmission(
  participationId: string,
  files: File[],
  description?: string,
  onProgress?: (percent: number) => void,
): Promise<Submission> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  if (description) formData.append('description', description)

  const response = await client.post<Submission>(`/submissions/${participationId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return response.data
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  await client.delete(`/submissions/${submissionId}`)
}

export async function getMySubmissions(): Promise<Submission[]> {
  const response = await client.get<{ data: Submission[] }>('/submissions/me')
  return response.data.data
}

export async function getDownloadUrl(fileId: string): Promise<string> {
  const response = await client.get<{ url: string }>(`/submissions/files/${fileId}/download`)
  return response.data.url
}
