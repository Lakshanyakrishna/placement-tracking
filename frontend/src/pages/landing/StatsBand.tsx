import { useCountUp } from './useCountUp'

interface Stat {
  value: number
  prefix?: string
  suffix?: string
  label: string
}

const STATS: Stat[] = [
  { value: 6000, suffix: '+', label: 'Placements' },
  { value: 14000, suffix: '+', label: 'Engineers Graduated' },
  { value: 895, label: 'Offers for 2024 Graduates' },
  { value: 48, prefix: '₹', suffix: ' LPA', label: 'Highest Package' },
]

function StatCounter({ stat }: { stat: Stat }) {
  const { ref, value } = useCountUp(stat.value)
  return (
    <div ref={ref} className="text-center">
      <p className="font-stmary text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
        {stat.prefix}
        {value.toLocaleString('en-IN')}
        {stat.suffix}
      </p>
      <p className="mt-2 text-xs font-medium text-white/70 sm:text-sm">{stat.label}</p>
    </div>
  )
}

export function StatsBand() {
  return (
    <section className="bg-stmary-primary py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-white/70">
          St. Mary&apos;s Placement Record
        </p>
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">
          {STATS.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </div>
        <p className="mt-10 text-center text-[11px] text-white/50">Source: stmarysgroup.com</p>
      </div>
    </section>
  )
}
