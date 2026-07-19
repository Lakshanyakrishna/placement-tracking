import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { BridgeScene } from './BridgeScene'
import { LoginCard } from './LoginCard'

interface LoginScreenProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>
  onClose: () => void
}

export function LoginScreen({ onSubmit, onClose }: LoginScreenProps) {
  const [revealed, setRevealed] = useState(false)
  const mobileFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Below `lg` the login form isn't a side panel — it's stacked below the
    // full-height bridge illustration, so revealing it can leave it entirely
    // below the fold with no visual cue. Auto-scroll it into view so the
    // "reward" for building the bridge doesn't look like nothing happened.
    if (!revealed || !mobileFormRef.current) return
    const timeout = setTimeout(() => {
      mobileFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 550)
    return () => clearTimeout(timeout)
  }, [revealed])

  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden bg-[#e4e9ee]">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-600 backdrop-blur-sm hover:text-slate-900"
      >
        <X className="h-4 w-4" />
      </button>

      <motion.div
        animate={{ marginRight: revealed ? '26rem' : '0rem' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="hidden h-full lg:block"
      >
        <BridgeScene revealed={revealed} onToggle={() => setRevealed((v) => !v)} />
      </motion.div>

      <div className="h-full lg:hidden">
        <BridgeScene revealed={revealed} onToggle={() => setRevealed((v) => !v)} />
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-y-0 right-0 z-20 hidden w-[26rem] items-center justify-center bg-slate-900/10 px-8 backdrop-blur-sm lg:flex"
          >
            <LoginCard onSubmit={onSubmit} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealed && (
          <motion.div
            ref={mobileFormRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative z-20 flex justify-center px-4 py-10 lg:hidden"
          >
            <LoginCard onSubmit={onSubmit} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
