import { useQuery } from '@tanstack/react-query'
import * as participationsApi from '@/api/participations.api'
import * as sectionsApi from '@/api/sections.api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function VerificationsListPage() {
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.listSections(),
  })

  const sectionId = sections?.[0]?.id

  const { data: sectionParts, isLoading } = useQuery({
    queryKey: ['section-participations', sectionId],
    queryFn: () => (sectionId ? participationsApi.getSectionParticipations(sectionId).then(r => r.data) : []),
    enabled: !!sectionId,
  })

  const pending = sectionParts?.filter((p) => p.status === 'submitted') ?? []

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verifications</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} pending verification{pending.length !== 1 ? 's' : ''}
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending verifications</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Certification</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{p.userName ?? '—'}</td>
                  <td className="px-4 py-3">{p.opportunity?.title ?? p.opportunityTitle ?? '—'}</td>
                  <td className="px-4 py-3 capitalize">{p.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
