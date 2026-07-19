import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationSealProps {
  label: string
  className?: string
}

/** The accountability payoff moment: once a mentor/team leader has signed off
 * on a submission, it's marked with this seal rather than a plain status pill
 * — a small visual stand-in for an official verification stamp. */
export function VerificationSeal({ label, className }: VerificationSealProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-stmary-gradient px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm',
        className,
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      {label}
    </span>
  )
}
