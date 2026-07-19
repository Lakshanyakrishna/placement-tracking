const ITEMS = ["UGC Autonomous", "NAAC 'A' Grade", 'ISO 9001:2015', 'JNTUH Affiliated']

export function AccreditationStrip() {
  return (
    <section className="border-y border-gray-200 bg-white py-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 sm:px-6">
        {ITEMS.map((item, i) => (
          <span key={item} className="flex items-center gap-3">
            <span className="text-xs font-medium tracking-wide text-gray-500 sm:text-sm">{item}</span>
            {i < ITEMS.length - 1 && <span className="h-1 w-1 rounded-full bg-gray-300" />}
          </span>
        ))}
      </div>
    </section>
  )
}
