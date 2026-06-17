import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/opportunities.api'
import type { OpportunityFilter, CreateOpportunityDto, UpdateOpportunityDto } from '@/types/opportunity'

export function useOpportunities(filter?: OpportunityFilter) {
  return useQuery({
    queryKey: ['opportunities', filter],
    queryFn: () => api.listOpportunities(filter),
  })
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => api.getOpportunity(id),
    enabled: !!id,
  })
}

export function useCreateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateOpportunityDto) => api.createOpportunity(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}

export function useUpdateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOpportunityDto }) => api.updateOpportunity(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}

export function useDeleteOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteOpportunity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}

export function usePublishOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.publishOpportunity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}

export function useArchiveOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.archiveOpportunity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}
