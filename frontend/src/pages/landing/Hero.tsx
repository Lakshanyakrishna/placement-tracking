import { ArrowRight } from 'lucide-react'
import adminDashboardShot from '@/assets/screenshots/admin-dashboard.webp'

interface HeroProps {
  onLoginClick: () => void
}

export function Hero({ onLoginClick }: HeroProps) {
  const scrollToFeatures = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-red-50/60 to-white pt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-in-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stmary-primary/15 bg-stmary-primary/5 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-stmary-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stmary-primary">
              St. Mary&apos;s Group of Institutions
            </span>
          </div>

          <h1 className="font-stmary text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Track Every Opportunity.
            <br />
            <span className="text-stmary-primary">Verify Every Achievement.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
            One platform for students to pursue placements and certifications, mentors and team
            leaders to verify proof of achievement, and the placement cell to track every group's
            progress — all in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 rounded-full bg-stmary-primary px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-stmary-primary/20 transition-colors hover:bg-stmary-primary-dark"
            >
              Login <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="rounded-full border border-gray-300 px-7 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="relative animate-fade-in-scale">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-gray-300/40">
            <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            </div>
            <img
              src={adminDashboardShot}
              alt="Admin dashboard showing student counts, group performance, and certification tracking"
              className="w-full"
              width={900}
              height={563}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
