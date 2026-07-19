import { motion } from 'framer-motion'
import { MousePointerClick, User, Check, ArrowRight } from 'lucide-react'

interface BridgeSceneProps {
  revealed: boolean
  onToggle: () => void
}

const FEATURES = [
  { title: 'Connect Talent', desc: 'Students to opportunities' },
  { title: 'Discover Opportunities', desc: 'Publish every drive' },
  { title: 'Track Placement', desc: 'Watch progress in real time' },
  { title: 'Achieve Success', desc: 'See every outcome' },
]

const WALKERS = Array.from({ length: 6 })
const DOTS = Array.from({ length: 4 })

export function BridgeScene({ revealed, onToggle }: BridgeSceneProps) {
  return (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden px-6 pb-10 pt-20 text-white sm:px-10 sm:pb-12 sm:pt-12"
      style={{
        background: 'linear-gradient(180deg, #0e0a1f 0%, #1c1035 45%, #3a1f4d 75%, #6b3350 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 55% 60%, rgba(251,191,36,0.22), transparent 55%)',
        }}
      />

      <div className="relative z-10 text-center">
        <p className="font-stmary text-lg font-semibold sm:text-xl">Build Connections. Create Futures.</p>
        <p className="mt-1 text-xs text-white/50 sm:text-sm">You bridge talent to opportunities.</p>
      </div>

      {/* Progress indicator — only during the revealed state, mirrors "Building connections..." */}
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : -8 }}
        transition={{ duration: 0.3, delay: revealed ? 0.5 : 0 }}
        className="relative z-10 mx-auto flex flex-col items-center gap-2"
      >
        <p className="text-xs font-medium text-white/60">Building connections...</p>
        <div className="flex items-center gap-2">
          {DOTS.map((_, i) => (
            <motion.span
              key={i}
              initial={false}
              animate={{ scale: revealed ? 1 : 0.5, opacity: revealed ? 1 : 0.3 }}
              transition={{ duration: 0.25, delay: revealed ? 0.6 + i * 0.12 : 0 }}
              className="h-1.5 w-6 rounded-full bg-white/25"
            />
          ))}
          <motion.span
            initial={false}
            animate={{ scale: revealed ? 1 : 0.5, opacity: revealed ? 1 : 0 }}
            transition={{ duration: 0.25, delay: revealed ? 0.6 + DOTS.length * 0.12 : 0 }}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[#1c1035]"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto h-52 w-full max-w-md sm:h-60">
        {/* cliffs */}
        <div className="absolute bottom-[30%] left-0 h-6 w-[22%] rounded-tr-xl bg-white/10" />
        <div className="absolute bottom-[30%] right-0 h-6 w-[22%] rounded-tl-xl bg-white/10" />

        {/* bridge path — undrawn when idle, draws in when revealed */}
        <svg viewBox="0 0 400 160" className="absolute bottom-[26%] left-0 h-24 w-full sm:h-28">
          <motion.path
            d="M 60 130 Q 200 40 340 130"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
            initial={false}
            animate={{ pathLength: revealed ? 1 : 0, opacity: revealed ? 1 : 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        </svg>

        {/* city skyline — fades in on reveal */}
        <motion.div
          initial={false}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 0.4, delay: revealed ? 0.5 : 0 }}
          className="absolute bottom-[30%] right-0 flex h-16 w-[26%] items-end gap-1"
        >
          {[10, 16, 12, 20, 8].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-white/15" style={{ height: `${h * 4}px` }} />
          ))}
        </motion.div>

        {/* walking figures — only appear once the bridge is built */}
        {WALKERS.map((_, i) => {
          const t = i / (WALKERS.length - 1)
          const x = 26 + t * 48
          const arcLift = 16 * Math.sin(Math.PI * t)
          return (
            <div
              key={i}
              className="absolute bottom-[38%] -translate-x-1/2"
              style={{ left: `${x}%`, marginBottom: `${arcLift}px` }}
            >
              <motion.div
                initial={false}
                animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 6 }}
                transition={{ duration: 0.35, delay: revealed ? 0.9 + i * 0.08 : 0 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15"
              >
                <User className="h-3.5 w-3.5 text-white" />
              </motion.div>
            </div>
          )
        })}

        <span className="absolute bottom-[8%] left-0 rounded-md bg-indigo-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
          Students
        </span>
        <span className="absolute bottom-[8%] right-0 rounded-md bg-indigo-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
          Companies
        </span>

        {/* reveal / hide toggle */}
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label={revealed ? 'Hide the login form' : 'Build the bridge to sign in'}
          className="absolute left-1/2 top-[8%] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-[#1c1035] text-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.4)]"
          animate={{ rotate: revealed ? 180 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>

      {/* idle-only hint */}
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 0 : 1, height: revealed ? 0 : 'auto' }}
        transition={{ duration: 0.25 }}
        className="relative z-10 flex flex-col items-center gap-2 overflow-hidden"
      >
        <div className="relative">
          <svg
            viewBox="0 0 60 40"
            className="pointer-events-none absolute -right-8 -top-3 h-9 w-14 text-white/40"
            fill="none"
          >
            <path d="M2 34 C 20 34, 28 18, 44 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M36 4 L46 6 L42 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30">
            <MousePointerClick className="h-5 w-5 text-white/70" />
          </div>
        </div>
        <p className="text-xs text-white/50">Click to build the bridge</p>
      </motion.div>

      {/* revealed-only feature row */}
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 1 : 0, height: revealed ? 'auto' : 0 }}
        transition={{ duration: 0.3, delay: revealed ? 0.6 : 0 }}
        className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-5 overflow-hidden text-xs sm:text-sm"
      >
        {FEATURES.map(({ title, desc }) => (
          <div key={title}>
            <p className="font-semibold text-white">{title}</p>
            <p className="text-white/50">{desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
