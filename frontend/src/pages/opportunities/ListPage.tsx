import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useOpportunities, usePublishOpportunity, useDeleteOpportunity, useArchiveOpportunity } from '@/hooks/useOpportunities'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable } from '@/components/shared/DataTable'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES, OPPORTUNITY_STATES, isPlacementType } from '@/lib/constants'
import { Plus, Send, Archive, Trash2, Pencil, Users } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { Opportunity } from '@/types/opportunity'

const stateColors: Record<string, string> = {
  [OPPORTUNITY_STATES.DRAFT]: 'bg-gray-100 text-gray-800',
  [OPPORTUNITY_STATES.PUBLISHED]: 'bg-blue-100 text-blue-800',
  [OPPORTUNITY_STATES.OPEN]: 'bg-green-100 text-green-800',
  [OPPORTUNITY_STATES.CLOSED]: 'bg-yellow-100 text-yellow-800',
  [OPPORTUNITY_STATES.ARCHIVED]: 'bg-orange-100 text-orange-800',
  [OPPORTUNITY_STATES.CANCELLED]: 'bg-red-100 text-red-800',
}

export default function OpportunityListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = !!user?.roles.includes('admin')
  const page = Number(searchParams.get('page')) || 1
  const { data, isLoading, error, refetch } = useOpportunities({ page, limit: 20 })
  const publish = usePublishOpportunity()
  const archive = useArchiveOpportunity()
  const deleteOpp = useDeleteOpportunity()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner fullPage />
  if (error) return <ErrorState onRetry={refetch} />

  const handlePublish = async (id: string) => {
    try { await publish.mutateAsync(id) } catch { /* toast */ }
  }

  const handleArchive = async (id: string) => {
    try { await archive.mutateAsync(id) } catch { /* toast */ }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteOpp.mutateAsync(deleteId)
      setDeleteId(null)
    } catch { /* toast */ }
  }

  const rows = isAdmin
    ? data?.data ?? []
    : (data?.data ?? []).filter((o) => o.createdBy === user?.id || isPlacementType(o.opportunityType))

  const canManage = (row: Opportunity) => isAdmin || row.createdBy === user?.id

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row: Opportunity) => (
        canManage(row) ? (
          <button className="font-medium hover:underline" onClick={() => navigate(ROUTES.ADMIN_OPPORTUNITIES_EDIT(row.id))}>
            {row.title}
          </button>
        ) : (
          <span className="font-medium">{row.title}</span>
        )
      ),
    },
    { key: 'opportunityType', label: 'Type' },
    {
      key: 'state',
      label: 'State',
      render: (row: Opportunity) => <Badge className={stateColors[row.state]}>{row.state}</Badge>,
    },
    {
      key: 'opensAt',
      label: 'Opens',
      render: (row: Opportunity) => row.opensAt ? new Date(row.opensAt).toLocaleDateString() : '-',
    },
    {
      key: 'closesAt',
      label: 'Closes',
      render: (row: Opportunity) => row.closesAt ? new Date(row.closesAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: '',
      render: (row: Opportunity) => (
        canManage(row) ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              title="Edit"
              onClick={() => navigate(ROUTES.ADMIN_OPPORTUNITIES_EDIT(row.id))}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {row.state === OPPORTUNITY_STATES.DRAFT && (
              <>
                <Button size="sm" variant="ghost" title="Publish" onClick={() => handlePublish(row.id)} disabled={publish.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Delete" className="text-destructive" onClick={() => setDeleteId(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {(row.state === OPPORTUNITY_STATES.PUBLISHED || row.state === OPPORTUNITY_STATES.OPEN || row.state === OPPORTUNITY_STATES.CLOSED) && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  title="View registrations"
                  onClick={() => navigate(ROUTES.ADMIN_OPPORTUNITIES_ANALYTICS(row.id))}
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Archive" onClick={() => handleArchive(row.id)} disabled={archive.isPending}>
                  <Archive className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ) : null
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAdmin ? 'Opportunities' : 'Certifications'}</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage placement opportunities' : 'Manage certifications for your students, plus view placement drives'}
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.ADMIN_OPPORTUNITIES_NEW)}>
          <Plus className="mr-2 h-4 w-4" />
          {isAdmin ? 'Create Opportunity' : 'Post Certification'}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        meta={data?.meta}
        onPageChange={(p) => setSearchParams({ page: String(p) })}
        keyExtractor={(row: Opportunity) => row.id}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Delete Opportunity"
        description="Are you sure you want to delete this draft? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteOpp.isPending}
      />
    </div>
  )
}
