import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { useStudentDashboardData } from '@/hooks/useStudentDashboardData'
import { useAuth } from '@/contexts/AuthContext'
import * as sectionsApi from '@/api/sections.api'
import * as groupsApi from '@/api/groups.api'
import { FileText, Clock, CheckCircle, AlertCircle, User, Hash, BookOpen, Users } from 'lucide-react'

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useStudentDashboardData()
  const enrollment = (user as any)?.enrollment

  const { data: enrollmentInfo } = useQuery({
    queryKey: ['student-enrollment-info', user?.id],
    queryFn: async () => {
      let sectionName = ''
      let groupName = ''

      if (enrollment?.sectionId) {
        try {
          const section = await sectionsApi.getSection(enrollment.sectionId)
          sectionName = section.name ?? section.code ?? ''
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

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-5">
      {/* Student Information */}
      <Card>
        <CardContent className="flex items-center gap-6 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stmarys-light">
            <User className="h-6 w-6 text-stmarys" />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Roll No:</span>
              <span className="font-medium">{enrollmentInfo?.rollNumber || '\u2014'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Section:</span>
              <span className="font-medium">{enrollmentInfo?.sectionName || '\u2014'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Group:</span>
              <span className="font-medium">{enrollmentInfo?.groupName || '\u2014'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certification Status */}
      <div>
        <h2 className="text-base font-semibold mb-3">Certification Status</h2>
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="rounded-full bg-blue-100 p-2">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Not Started</p>
                <p className="text-lg font-bold">{data.summary.assigned}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="rounded-full bg-orange-100 p-2">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-lg font-bold">{data.summary.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-lg font-bold">{data.summary.pendingVerification}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verified</p>
                <p className="text-lg font-bold">{data.summary.completed}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
