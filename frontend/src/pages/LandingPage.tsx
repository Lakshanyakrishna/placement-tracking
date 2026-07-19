import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Navbar } from './landing/Navbar'
import { Hero } from './landing/Hero'
import { StatsBand } from './landing/StatsBand'
import { HowItWorks } from './landing/HowItWorks'
import { FeatureHighlights } from './landing/FeatureHighlights'
import { AccreditationStrip } from './landing/AccreditationStrip'
import { Footer } from './landing/Footer'

// Lazy-loaded: this pulls in framer-motion for the bridge-toggle illustration,
// so keeping it out of the eager import graph is what keeps this page's own
// Lighthouse score high — a first-time visitor to "/" doesn't download it until
// they actually click "Login".
const BridgeLoginModal = lazy(() => import('./landing/BridgeLoginModal'))

export default function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loginOpen, setLoginOpen] = useState(() => searchParams.get('login') === 'true')

  const closeLogin = () => {
    setLoginOpen(false)
    if (searchParams.has('login')) {
      searchParams.delete('login')
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-white font-stmary">
      <Navbar onLoginClick={() => setLoginOpen(true)} />
      <Hero onLoginClick={() => setLoginOpen(true)} />
      <StatsBand />
      <HowItWorks />
      <FeatureHighlights />
      <AccreditationStrip />
      <Footer />
      {loginOpen && (
        <Suspense fallback={null}>
          <BridgeLoginModal onClose={closeLogin} />
        </Suspense>
      )}
    </div>
  )
}
