import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { BridgeScene } from './BridgeScene'
import { LoginCard } from './LoginCard'

interface LoginScreenProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>
}

export function LoginScreen({ onSubmit }: LoginScreenProps) {
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a12]">
      <button
        onClick={() => navigate('/')}
        className="absolute left-6 top-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-sm text-white/70 backdrop-blur-sm hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div
        animate={{ marginRight: revealed ? '26rem' : '0rem' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="hidden h-screen lg:block"
      >
        <BridgeScene revealed={revealed} onToggle={() => setRevealed((v) => !v)} />
      </motion.div>

      <div className="h-screen lg:hidden">
        <BridgeScene revealed={revealed} onToggle={() => setRevealed((v) => !v)} />
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 z-20 hidden w-[26rem] items-center justify-center bg-black/20 px-8 backdrop-blur-sm lg:flex"
          >
            <LoginCard onSubmit={onSubmit} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealed && (
          <motion.div
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
