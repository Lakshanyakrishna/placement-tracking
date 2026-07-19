import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

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
const PLANK_COUNT = 14

// A single, restrained silhouette figure — one muted tone throughout, with the
// brand red used only as a small accent (the bag), not a rainbow of colors.
function Person() {
  return (
    <div className="relative h-9 w-5 drop-shadow-sm">
      <div className="absolute left-[1px] top-[14px] h-2.5 w-1.5 rounded-sm bg-stmary-primary/80" />
      <div className="absolute bottom-0 left-[3px] h-3 w-[5px] rounded-b-sm bg-slate-500" />
      <div className="absolute bottom-0 right-[3px] h-3.5 w-[5px] rounded-b-sm bg-slate-600" />
      <div className="absolute left-1/2 top-[9px] h-4 w-4 -translate-x-1/2 rounded-t-full rounded-b-sm bg-slate-700" />
      <div className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-400" />
    </div>
  )
}

export function BridgeScene({ revealed, onToggle }: BridgeSceneProps) {
  return (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden px-6 pb-10 pt-20 sm:px-10 sm:pb-12 sm:pt-12"
      style={{
        background: 'linear-gradient(180deg, #eef1f4 0%, #e4e9ee 50%, #dde4ea 100%)',
      }}
    >
      {/* soft ambient glow — a single restrained accent, not a bright cartoon sun */}
      <div
        className="pointer-events-none absolute left-1/2 top-4 h-40 w-40 -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(184,32,32,0.08), transparent 70%)',
        }}
      />

      <div className="relative z-10 text-center">
        <p className="font-stmary text-lg font-semibold text-slate-800 sm:text-xl">
          Build Connections. Create Futures.
        </p>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">You bridge talent to opportunities.</p>
      </div>

      {/* Progress indicator — only during the revealed state, mirrors "Building connections..." */}
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : -8 }}
        transition={{ duration: 0.3, delay: revealed ? 0.5 : 0 }}
        className="relative z-10 mx-auto flex flex-col items-center gap-2"
      >
        <p className="text-xs font-medium text-slate-500">Building connections...</p>
        <div className="flex items-center gap-2">
          {DOTS.map((_, i) => (
            <motion.span
              key={i}
              initial={false}
              animate={{ scale: revealed ? 1 : 0.5, opacity: revealed ? 1 : 0.3 }}
              transition={{ duration: 0.25, delay: revealed ? 0.6 + i * 0.12 : 0 }}
              className="h-1.5 w-6 rounded-full bg-slate-300"
            />
          ))}
          <motion.span
            initial={false}
            animate={{ scale: revealed ? 1 : 0.5, opacity: revealed ? 1 : 0 }}
            transition={{ duration: 0.25, delay: revealed ? 0.6 + DOTS.length * 0.12 : 0 }}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-stmary-primary text-white"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto h-56 w-full max-w-md sm:h-64">
        {/* platforms — smooth, minimal stone plateaus (soft rounded top, not jagged
            cartoon rock) with a subtle shadow for depth */}
        <div className="absolute bottom-[32%] left-0 h-9 w-[26%] rounded-t-2xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_6px_14px_-6px_rgba(30,41,59,0.35)]" />
        <div className="absolute bottom-[32%] right-0 h-9 w-[26%] rounded-t-2xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_6px_14px_-6px_rgba(30,41,59,0.35)]" />

        {/* students waiting on the near platform — visible until the bridge is
            built, then they set off across it (the WALKERS below take over) */}
        <motion.div
          initial={false}
          animate={{ opacity: revealed ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-[40%] left-[6%] flex items-end gap-1.5"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Person key={i} />
          ))}
        </motion.div>

        {/* bridge deck — a slim CSS-only arch (border-radius trick, no SVG path),
            undrawn when idle, "draws" itself left-to-right via a clip-path wipe */}
        <div className="absolute bottom-[28%] left-1/2 h-[72px] w-[84%] -translate-x-1/2 sm:h-20">
          <motion.div
            initial={false}
            animate={{ clipPath: revealed ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-full w-full"
          >
            <div
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0', overflow: 'hidden' }}
            >
              <div className="flex h-full w-full items-end gap-[3px] px-1">
                {Array.from({ length: PLANK_COUNT }).map((_, i) => {
                  const t = i / (PLANK_COUNT - 1)
                  const arcHeight = 24 * Math.sin(Math.PI * t)
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-[1px] bg-slate-400"
                      style={{ height: `${6 + arcHeight}px`, marginBottom: `${arcHeight}px` }}
                    />
                  )
                })}
              </div>
            </div>
            <div
              className="absolute inset-x-0 top-0 h-1/2"
              style={{
                borderTop: '1.5px solid rgba(100,116,139,0.4)',
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
              }}
            />
          </motion.div>
        </div>

        {/* office skyline — fades in on reveal, clean glass towers in a single
            muted tone family, minimal roofline variation */}
        <motion.div
          initial={false}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 0.4, delay: revealed ? 0.5 : 0 }}
          className="absolute bottom-[32%] right-0 flex h-24 w-[30%] items-end gap-1.5"
        >
          {[42, 68, 50, 82, 36].map((h, i) => (
            <div
              key={i}
              className="h-full flex-1 rounded-t-sm"
              style={{
                height: `${h}px`,
                backgroundImage:
                  'linear-gradient(180deg, #c3cbd3, #a7b1bb), linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 100% 8px, 7px 100%',
              }}
            />
          ))}
        </motion.div>

        {/* walking figures — only appear once the bridge is built */}
        {WALKERS.map((_, i) => {
          const t = i / (WALKERS.length - 1)
          const x = 26 + t * 48
          const arcLift = 15 * Math.sin(Math.PI * t)
          return (
            <div
              key={i}
              className="absolute bottom-[40%] -translate-x-1/2"
              style={{ left: `${x}%`, marginBottom: `${arcLift}px` }}
            >
              <motion.div
                initial={false}
                animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 6 }}
                transition={{ duration: 0.35, delay: revealed ? 0.9 + i * 0.08 : 0 }}
              >
                <Person />
              </motion.div>
            </div>
          )
        })}

        <span className="absolute bottom-[9%] left-0 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
          Students
        </span>
        <span className="absolute bottom-[9%] right-0 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
          Companies
        </span>

        {/* reveal / hide toggle — the single focal interactive element on this
            screen, so it gets the "complex tier" treatment: a magnetic pull
            toward the cursor on desktop hover, plus an idle breathing ring
            while collapsed so it reads as clickable before the user has
            touched anything. Both respect prefers-reduced-motion. */}
        <BridgeToggleButton revealed={revealed} onToggle={onToggle} />
      </div>

      {/* idle-only CTA — a real, clearly-labeled button, not just a decorative hint.
          A student clicking "Login" needs to immediately understand what to do next. */}
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 0 : 1, height: revealed ? 0 : 'auto' }}
        transition={{ duration: 0.25 }}
        className="relative z-10 flex flex-col items-center overflow-hidden"
      >
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-2 rounded-full bg-stmary-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-stmary-primary-dark"
        >
          Continue to Sign In
          <ArrowRight className="h-4 w-4" />
        </button>
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
            <p className="font-semibold text-slate-800">{title}</p>
            <p className="text-slate-500">{desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

interface BridgeToggleButtonProps {
  revealed: boolean
  onToggle: () => void
}

function BridgeToggleButton({ revealed, onToggle }: BridgeToggleButtonProps) {
  const prefersReducedMotion = useReducedMotion()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Magnetic pull: reserved for exactly this one focal element per the skill's
  // own "don't apply to more than 1-2 elements per screen" guidance. Springs
  // (not raw values) keep it feeling elastic rather than glued to the cursor;
  // the *0.3 factor and mouseleave reset keep it clamped inside its hit box.
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.5 })

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (prefersReducedMotion) return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  function handleClick() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
    onToggle()
  }

  return (
    <div className="absolute left-1/2 top-[4%] -translate-x-1/2">
      {/* idle breathing ring — only while collapsed, hints this is clickable
          before the user has touched anything. Off entirely for reduced motion. */}
      {!revealed && !prefersReducedMotion && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-stmary-primary/40"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={revealed ? 'Hide the login form' : 'Build the bridge to sign in'}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-stmary-primary/30 bg-white text-stmary-primary shadow-md"
        style={{ x: springX, y: springY }}
        animate={{ rotate: revealed ? 180 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <ArrowRight className="h-5 w-5" />
      </motion.button>
    </div>
  )
}
