import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  right?: ReactNode
  className?: string
}

export function DashboardHeader({ title, subtitle, icon, right, className }: DashboardHeaderProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-stmary-glow p-6 text-white shadow-sm', className)}>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  )
}
