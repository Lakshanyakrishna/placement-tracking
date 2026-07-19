import { GraduationCap, Users, ShieldCheck, Building2, type LucideIcon } from 'lucide-react'

interface RoleCard {
  icon: LucideIcon
  role: string
  bullets: string[]
}

const ROLES: RoleCard[] = [
  {
    icon: GraduationCap,
    role: 'Student',
    bullets: [
      'See placements and certifications targeted to your own group and section',
      'Upload proof documents and track verification status in real time',
      'One dashboard for every opportunity, submission, and outcome',
    ],
  },
  {
    icon: Users,
    role: 'Team Leader',
    bullets: [
      'Post certifications scoped to your own group',
      'Review submitted proof and approve or reject with a reason',
      'Track your group\'s completion rate at a glance',
    ],
  },
  {
    icon: ShieldCheck,
    role: 'Mentor',
    bullets: [
      'Oversee certification activity across every group in your section',
      'See what each team leader has posted and how it\'s progressing',
      'Spot groups that need follow-up before deadlines slip',
    ],
  },
  {
    icon: Building2,
    role: 'Placement Cell',
    bullets: [
      'Publish placement drives that reach every group at once',
      'Bulk-import students, groups, and mentors from Excel',
      'View section-wide analytics and completion dashboards',
    ],
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stmary-primary">
            How It Works
          </p>
          <h2 className="font-stmary text-3xl font-bold text-gray-900 sm:text-4xl">
            Built for every role in the placement process
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div
              key={r.role}
              className="rounded-2xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-stmary-primary/10 text-stmary-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="font-stmary text-lg font-semibold text-gray-900">{r.role}</h3>
              <ul className="mt-3 space-y-2">
                {r.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm leading-relaxed text-gray-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stmary-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
