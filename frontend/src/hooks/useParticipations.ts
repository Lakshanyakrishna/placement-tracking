import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/participations.api'
import type { ParticipationFilter, UpdateParticipationStatusDto } from '@/types/participation'

export function useParticipations(filter?: ParticipationFilter) {
  return useQuery({
    queryKey: ['participations', filter],
    queryFn: () => api.listParticipations(filter),
  })
}

export function useParticipation(id: string) {
  return useQuery({
    queryKey: ['participations', id],
    queryFn: () => api.getParticipation(id),
    enabled: !!id,
  })
}

export function useCreateParticipation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { opportunityId: string }) => api.createParticipation(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participations'] }),
  })
}

export function useUpdateParticipationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateParticipationStatusDto }) =>
      api.updateParticipationStatus(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participations'] }),
  })
}
