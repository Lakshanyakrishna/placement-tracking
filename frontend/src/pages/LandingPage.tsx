import { Navbar } from './landing/Navbar'
import { Hero } from './landing/Hero'
import { StatsBand } from './landing/StatsBand'
import { HowItWorks } from './landing/HowItWorks'
import { FeatureHighlights } from './landing/FeatureHighlights'
import { AccreditationStrip } from './landing/AccreditationStrip'
import { Footer } from './landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-stmary">
      <Navbar />
      <Hero />
      <StatsBand />
      <HowItWorks />
      <FeatureHighlights />
      <AccreditationStrip />
      <Footer />
    </div>
  )
}
