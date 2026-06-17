import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/submissions.api'

export function useSubmissions(participationId: string) {
  return useQuery({
    queryKey: ['submissions', participationId],
    queryFn: () => api.getSubmissionsByParticipation(participationId),
    enabled: !!participationId,
  })
}

export function useCreateSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      participationId,
      files,
      description,
      onProgress,
    }: {
      participationId: string
      files: File[]
      description?: string
      onProgress?: (percent: number) => void
    }) => api.createSubmission(participationId, files, description, onProgress),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  })
}

export function useDeleteSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (submissionId: string) => api.deleteSubmission(submissionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  })
}
