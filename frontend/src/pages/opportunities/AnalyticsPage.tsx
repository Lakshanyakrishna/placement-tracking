import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ArrowLeft, Users } from 'lucide-react'
import { useOpportunityAnalytics } from '@/hooks/useParticipations'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { StatGrid } from '@/components/dashboard/StatGrid'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/lib/constants'

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  verified: 'Verified',
  completed: 'Completed',
  incomplete: 'Incomplete',
  rejected: 'Rejected',
}

export default function OpportunityAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useOpportunityAnalytics(id!)

  if (isLoading) return <LoadingSpinner fullPage />
  if (error) return <ErrorState onRetry={refetch} />
  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN_OPPORTUNITIES)} className="mb-2 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Opportunities
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{data.opportunityTitle}</h1>
        <p className="text-muted-foreground">Who has registered, broken down by group</p>
      </div>

      <StatGrid className="sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
        <StatCard title="Total Registered" value={data.totalRegistered} />
        <StatCard title="Groups Represented" value={data.groups.length} />
      </StatGrid>

      {data.groups.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Registrations by Group</h2>
            <p className="mb-3 text-xs text-muted-foreground">How many students in each group have registered</p>
            <ResponsiveContainer width="100%" height={Math.max(180, data.groups.length * 48)}>
              <BarChart
                data={data.groups.map((g) => ({ name: g.groupName, Registered: g.registeredCount }))}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <defs>
                  <linearGradient id="analyticsRegisteredGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8f1919" />
                    <stop offset="100%" stopColor="#b82020" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="Registered" fill="url(#analyticsRegisteredGradient)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {data.groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No registrations yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nobody in a group you can view has registered for this opportunity yet.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Team Leader</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status breakdown</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((g) => (
                  <tr key={g.groupId} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{g.groupName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{g.teamLeaderName ?? '—'}</td>
                    <td className="px-4 py-3">{g.registeredCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {Object.entries(g.statusBreakdown).map(([status, count]) => (
                          <span key={status}>
                            {STATUS_LABELS[status] ?? status}: <span className="font-medium text-foreground">{count}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
