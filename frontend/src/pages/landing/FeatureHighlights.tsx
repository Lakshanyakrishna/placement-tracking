import verificationShot from '@/assets/screenshots/verification-queue.webp'
import studentShot from '@/assets/screenshots/student-dashboard.webp'
import mentorShot from '@/assets/screenshots/mentor-dashboard.webp'

interface Feature {
  title: string
  description: string
  image: string
  alt: string
  imageFirst: boolean
}

// Note: there is no bulk-import screen in this app's UI — Excel imports are an
// API-only admin capability (see e2e/tests/imports.spec.ts). The mentor's
// cross-group certification breakdown is used here instead, as the real screen
// that best demonstrates oversight beyond a single group.
const FEATURES: Feature[] = [
  {
    title: 'Verification, built for accountability',
    description:
      'Team leaders review every submitted proof document from their own dashboard and approve or reject it with a reason — so students always know exactly where they stand.',
    image: verificationShot,
    alt: 'Team leader dashboard showing a pending certification submission with Approve and Reject actions',
    imageFirst: true,
  },
  {
    title: 'Everything a student needs, in one place',
    description:
      'Available placements and certifications, in-progress work, and verified achievements — all on a single dashboard, scoped automatically to the student\'s own group and section.',
    image: studentShot,
    alt: 'Student dashboard showing available placements, certifications, and verification status',
    imageFirst: false,
  },
  {
    title: 'Full visibility, without micromanaging',
    description:
      'Mentors see what every team leader has posted for their group and how it\'s progressing — completion rates, pending reviews, and rejections — across the whole section at once.',
    image: mentorShot,
    alt: 'Mentor dashboard showing certification completion breakdown across multiple groups',
    imageFirst: true,
  },
]

export function FeatureHighlights() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl space-y-20 px-4 sm:space-y-28 sm:px-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
          >
            <div className={f.imageFirst ? 'lg:order-1' : 'lg:order-2'}>
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/60">
                <img src={f.image} alt={f.alt} loading="lazy" className="w-full" width={900} height={563} />
              </div>
            </div>
            <div className={f.imageFirst ? 'lg:order-2' : 'lg:order-1'}>
              <h3 className="font-stmary text-2xl font-bold text-gray-900 sm:text-3xl">{f.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-gray-600">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
