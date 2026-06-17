import { Card, CardContent } from '@/components/ui/card'

interface HeroSectionProps {
  totalStudents: number
  totalGroups: number
  certificationsPosted: number
  activeCertifications: number
}

export function HeroSection({
  totalStudents,
  totalGroups,
  certificationsPosted,
  activeCertifications,
}: HeroSectionProps) {
  const stats = [
    { label: 'Total Students', value: totalStudents },
    { label: 'Groups', value: totalGroups },
    { label: 'Certification Opportunities Posted', value: certificationsPosted },
    { label: 'Active Certifications', value: activeCertifications },
  ]

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">IV-AI&DS-A Placement Readiness</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Certification Tracking &amp; Readiness Monitoring
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
