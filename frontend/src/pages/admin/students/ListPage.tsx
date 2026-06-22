import { useQuery } from '@tanstack/react-query'
import * as sectionsApi from '@/api/sections.api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function StudentsListPage() {
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.listSections(),
  })

  const sectionId = sections?.[0]?.id

  const { data: students, isLoading } = useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: () => (sectionId ? sectionsApi.getSectionStudents(sectionId) : []),
    enabled: !!sectionId,
  })

  if (isLoading) return <LoadingSpinner fullPage />

  const sectionName = sections?.[0]?.code ?? 'Section'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">
          {sectionName} — {students?.length ?? 0} students enrolled
        </p>
      </div>

      {students && students.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Roll Number</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{s.rollNumber ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No students found</p>
      )}
    </div>
  )
}
