import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  suffix?: string
  className?: string
}

export function AnimatedNumber({ value, suffix, className }: AnimatedNumberProps) {
  const { ref, value: animated } = useCountUp(value, 900)

  return (
    <div ref={ref} className={cn('text-2xl font-bold text-[#111827]', className)}>
      {animated}
      {suffix}
    </div>
  )
}
