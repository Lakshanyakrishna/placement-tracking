import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { useStudentDashboardData } from '@/hooks/useStudentDashboardData'
import { useAuth } from '@/contexts/AuthContext'
import * as sectionsApi from '@/api/sections.api'
import * as groupsApi from '@/api/groups.api'
import * as participationsApi from '@/api/participations.api'
import * as opportunitiesApi from '@/api/opportunities.api'
import { FileText, Clock, CheckCircle, AlertCircle, ArrowRight, Sparkles, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isPlacementType } from '@/lib/constants'

function getUrgency(closesAt: string | null | undefined): { label: string; className: string } | null {
  if (!closesAt) return null
  const days = Math.ceil((new Date(closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: `${Math.abs(days)} days overdue`, className: 'text-red-600 bg-red-50 border-red-200' }
  if (days <= 7) return { label: `${days} days left`, className: 'text-orange-600 bg-orange-50 border-orange-200' }
  if (days <= 30) return { label: `${days} days left`, className: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
  return null
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const enrollment = (user as any)?.enrollment

  const { data: dash, isLoading, error, refetch } = useStudentDashboardData()

  const { data: enrollmentInfo } = useQuery({
    queryKey: ['student-enrollment-info', user?.id],
    queryFn: async () => {
      let sectionName = ''
      let groupName = ''
      if (enrollment?.sectionId) {
        try {
          const section = await sectionsApi.getSection(enrollment.sectionId)
          sectionName = section.code ?? ''
        } catch { /* ignore */ }
      }
      if (enrollment?.groupId) {
        try {
          const group = await groupsApi.getGroup(enrollment.groupId)
          groupName = group.name ?? ''
        } catch { /* ignore */ }
      }
      return { sectionName, groupName, rollNumber: enrollment?.rollNumber ?? '' }
    },
    enabled: !!user,
  })

  const { data: allParticipations } = useQuery({
    queryKey: ['my-participations-brief'],
    queryFn: async () => {
      const res = await participationsApi.getMyParticipations()
      return res.data ?? []
    },
    enabled: !!user,
  })

  const { data: allAvailableOpps } = useQuery({
    queryKey: ['available-opportunities-brief'],
    queryFn: async () => {
      return await opportunitiesApi.getAvailableOpportunities()
    },
    enabled: !!user,
  })

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !dash) return <ErrorState onRetry={refetch} />

  const certifications = (allParticipations ?? []).filter((p) => !isPlacementType(p.opportunity?.opportunityType ?? p.opportunityType ?? '')).slice(0, 4)
  const placements = (allParticipations ?? []).filter((p) => isPlacementType(p.opportunity?.opportunityType ?? p.opportunityType ?? '')).slice(0, 4)
  const availableOpps = (allAvailableOpps ?? []).filter((o) => !isPlacementType(o.opportunityType)).slice(0, 3)
  const availablePlacements = (allAvailableOpps ?? []).filter((o) => isPlacementType(o.opportunityType)).slice(0, 3)

  const needsAttention = certifications.filter(c => c.status === 'rejected')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827]">
          {user?.name}
        </h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B7280]">
          {enrollmentInfo?.rollNumber && <span>Roll No: {enrollmentInfo.rollNumber}</span>}
          {enrollmentInfo?.sectionName && <span>Section: {enrollmentInfo.sectionName}</span>}
          {enrollmentInfo?.groupName && <span>Group: {enrollmentInfo.groupName}</span>}
        </div>
      </div>

      {dash.summary.rejected > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-sm text-red-800">
              <strong>{dash.summary.rejected} item{dash.summary.rejected > 1 ? 's' : ''} need{dash.summary.rejected === 1 ? 's' : ''} attention.</strong>
              {' '}Please check the rejection reason and re-upload.
            </div>
            <button
              onClick={() => navigate('/student/certifications?filter=rejected')}
              className="ml-auto shrink-0 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              View
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Sparkles, label: 'Available', value: dash.summary.available, color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: FileText, label: 'Assigned', value: dash.summary.assigned, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Clock, label: 'In Progress', value: dash.summary.inProgress, color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: AlertCircle, label: 'Submitted', value: dash.summary.pendingVerification, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { icon: CheckCircle, label: 'Verified', value: dash.summary.completed, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: XCircle, label: 'Rejected', value: dash.summary.rejected, color: 'text-red-600', bg: 'bg-red-50' },
        ].filter(s => s.label !== 'Rejected' || dash.summary.rejected > 0).map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="mt-2 text-lg font-bold text-[#111827]">{s.value}</p>
              <p className="text-xs text-[#6B7280]">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {needsAttention.length > 0 && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-red-600" />
              <h2 className="text-sm font-semibold text-[#111827]">Needs Attention</h2>
            </div>
            <div className="space-y-2">
              {needsAttention.slice(0, 3).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{cert.opportunity?.title ?? cert.opportunityTitle ?? 'Unknown'}</p>
                    <p className="text-xs text-red-600">Rejected — {cert.notes || 'No reason provided'}</p>
                  </div>
                  <button
                    onClick={() => navigate('/student/certifications')}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Re-upload
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {availableOpps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#111827]">Available Certifications</h2>
            <button
              onClick={() => navigate('/student/certifications')}
              className="flex items-center gap-1 text-xs font-medium text-[#B91C1C] hover:text-[#991B1B]"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {availableOpps.map((opp) => (
              <Card key={opp.id} className="hover:shadow-md transition-shadow cursor-pointer border-purple-100" onClick={() => navigate('/student/certifications')}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-[#111827] line-clamp-2">{opp.title}</p>
                  <span className="mt-2 inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    Available
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {availablePlacements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#111827]">Available Placements</h2>
            <button
              onClick={() => navigate('/student/placements')}
              className="flex items-center gap-1 text-xs font-medium text-[#B91C1C] hover:text-[#991B1B]"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {availablePlacements.map((opp) => (
              <Card key={opp.id} className="hover:shadow-md transition-shadow cursor-pointer border-purple-100" onClick={() => navigate('/student/placements')}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-[#111827] line-clamp-2">{opp.title}</p>
                  <span className="mt-2 inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    Available
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#111827]">My Certifications</h2>
          <button
            onClick={() => navigate('/student/certifications')}
            className="flex items-center gap-1 text-xs font-medium text-[#B91C1C] hover:text-[#991B1B]"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {certifications.length === 0 && (
            <p className="col-span-full text-sm text-[#6B7280]">No certifications assigned yet.</p>
          )}
          {certifications.map((cert) => {
            const statusColors: Record<string, string> = {
              not_started: 'bg-gray-100 text-gray-700',
              in_progress: 'bg-blue-100 text-blue-700',
              submitted: 'bg-yellow-100 text-yellow-700',
              verified: 'bg-green-100 text-green-700',
              completed: 'bg-emerald-100 text-emerald-700',
              rejected: 'bg-red-100 text-red-700',
            }
            const urgency = getUrgency(cert.opportunity?.closesAt)
            return (
              <Card key={cert.id} className={`hover:shadow-md transition-shadow cursor-pointer ${urgency ? 'border-l-4 ' + urgency.className.split(' ').slice(-1)[0] : ''}`} onClick={() => navigate('/student/certifications')}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-[#111827] line-clamp-2">
                    {cert.opportunity?.title ?? cert.opportunityTitle ?? 'Unknown'}
                  </p>
                  {urgency && (
                    <p className={`mt-1 text-xs font-medium ${urgency.className.split(' ')[0]}`}>
                      {urgency.label}
                    </p>
                  )}
                  <span className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[cert.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {cert.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#111827]">My Placements</h2>
          <button
            onClick={() => navigate('/student/placements')}
            className="flex items-center gap-1 text-xs font-medium text-[#B91C1C] hover:text-[#991B1B]"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {placements.length === 0 && (
            <p className="col-span-full text-sm text-[#6B7280]">No placement drives assigned yet.</p>
          )}
          {placements.map((drive) => {
            const statusColors: Record<string, string> = {
              not_started: 'bg-gray-100 text-gray-700',
              in_progress: 'bg-blue-100 text-blue-700',
              submitted: 'bg-yellow-100 text-yellow-700',
              verified: 'bg-green-100 text-green-700',
              completed: 'bg-emerald-100 text-emerald-700',
              rejected: 'bg-red-100 text-red-700',
            }
            const urgency = getUrgency(drive.opportunity?.closesAt)
            return (
              <Card key={drive.id} className={`hover:shadow-md transition-shadow cursor-pointer ${urgency ? 'border-l-4 ' + urgency.className.split(' ').slice(-1)[0] : ''}`} onClick={() => navigate('/student/placements')}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-[#111827] line-clamp-2">
                    {drive.opportunity?.title ?? drive.opportunityTitle ?? 'Unknown'}
                  </p>
                  {urgency && (
                    <p className={`mt-1 text-xs font-medium ${urgency.className.split(' ')[0]}`}>
                      {urgency.label}
                    </p>
                  )}
                  <span className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[drive.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {drive.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
