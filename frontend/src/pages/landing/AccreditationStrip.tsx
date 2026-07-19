import { BadgeCheck, Award, ShieldCheck, Building2 } from 'lucide-react'
import { Reveal } from '@/components/shared/Reveal'

const ITEMS = [
  { label: 'UGC Autonomous', icon: BadgeCheck },
  { label: "NAAC 'A' Grade", icon: Award },
  { label: 'ISO 9001:2015', icon: ShieldCheck },
  { label: 'JNTUH Affiliated', icon: Building2 },
]

export function AccreditationStrip() {
  return (
    <section className="border-y border-gray-200 bg-white py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 sm:px-6">
        {ITEMS.map(({ label, icon: Icon }, i) => (
          <Reveal key={label} delayMs={i * 60} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stmary-primary/5 transition-transform duration-200 hover:scale-110">
              <Icon className="h-4 w-4 text-stmary-primary" />
            </span>
            <span className="text-xs font-medium tracking-wide text-gray-600 sm:text-sm">{label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
