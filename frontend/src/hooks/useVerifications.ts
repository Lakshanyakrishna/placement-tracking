import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/verifications.api'
import type { RejectSubmissionDto } from '@/types/verification'

export function usePendingVerifications() {
  return useQuery({
    queryKey: ['verifications', 'pending'],
    queryFn: api.getPendingVerifications,
  })
}

export function useApproveSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (submissionId: string) => api.approveSubmission(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verifications', 'pending'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRejectSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, dto }: { submissionId: string; dto: RejectSubmissionDto }) =>
      api.rejectSubmission(submissionId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verifications', 'pending'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
