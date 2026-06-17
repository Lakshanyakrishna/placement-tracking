import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { useStudentDashboardData } from '@/hooks/useStudentDashboardData'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function StudentDashboardPage() {
  const { data, isLoading, error, refetch } = useStudentDashboardData()

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !data) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Welcome, {data.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is your certification progress summary.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-3">
            <div className="rounded-full bg-blue-100 p-2">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned</p>
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
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold">{data.summary.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3">
            <div className="rounded-full bg-yellow-100 p-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Verification</p>
              <p className="text-lg font-bold">{data.summary.pendingVerification}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
