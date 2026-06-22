import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAuth } from '@/contexts/AuthContext'
import * as sectionsApi from '@/api/sections.api'
import * as groupsApi from '@/api/groups.api'
import { User, Mail, Hash, BookOpen, Users, GraduationCap, Shield } from 'lucide-react'

interface ProfileInfo {
  name: string
  email: string
  rollNumber: string
  section: string
  group: string
  mentor: string
  teamLeader: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const enrollment = (user as any)?.enrollment

  const { data: profile, isLoading, error, refetch } = useQuery<ProfileInfo>({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      const rollNumber = enrollment?.rollNumber ?? ''
      let sectionName = ''
      let mentor = ''
      let groupName = ''
      let teamLeader = ''

      if (enrollment?.sectionId) {
        try {
          const section = await sectionsApi.getSection(enrollment.sectionId)
          sectionName = section.code ?? ''
          mentor = section.mentorName ?? ''
        } catch {
          sectionName = ''
        }
      }

      if (enrollment?.groupId) {
        try {
          const group = await groupsApi.getGroup(enrollment.groupId)
          groupName = group.name ?? ''
          teamLeader = group.teamLeaderName ?? ''
        } catch {
          groupName = ''
        }
      }

      return {
        name: user?.name ?? '',
        email: user?.email ?? '',
        rollNumber: rollNumber || '',
        section: sectionName,
        group: groupName,
        mentor,
        teamLeader,
      }
    },
    enabled: !!user,
  })

  if (isLoading) return <LoadingSpinner fullPage />
  if (error || !profile) return <ErrorState onRetry={refetch} />

  const rows = [
    { icon: User, label: 'Name', value: profile.name },
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Hash, label: 'Roll Number', value: profile.rollNumber },
    { icon: BookOpen, label: 'Section', value: profile.section },
    { icon: Users, label: 'Group', value: profile.group },
    { icon: GraduationCap, label: 'Mentor', value: profile.mentor || 'Not Assigned' },
    { icon: Shield, label: 'Team Leader', value: profile.teamLeader || 'Not Assigned' },
  ]

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-[#111827]">Profile</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Your account and enrollment details.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#111827]">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 border-b border-[#F3F4F6] py-3 last:border-0"
            >
              <row.icon className="h-4 w-4 text-[#9CA3AF] shrink-0" />
              <span className="text-sm text-[#6B7280] w-28 shrink-0">{row.label}</span>
              <span className="text-sm font-medium text-[#111827]">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
