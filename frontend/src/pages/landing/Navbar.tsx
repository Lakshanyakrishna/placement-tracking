import { useState, useEffect } from 'react'
import crest from '@/assets/stmarys-crest.webp'

interface NavbarProps {
  onLoginClick: () => void
}

export function Navbar({ onLoginClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-none'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <img src={crest} alt="St. Mary's Group of Institutions" className="h-9 w-9 rounded-full" />
          <span className="font-stmary text-base font-bold tracking-tight text-gray-900 sm:text-lg">
            Placement Tracker
          </span>
        </div>

        <button
          onClick={onLoginClick}
          className="rounded-full bg-stmary-primary px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stmary-primary-dark hover:shadow-md"
        >
          Login
        </button>
      </div>
    </nav>
  )
}
