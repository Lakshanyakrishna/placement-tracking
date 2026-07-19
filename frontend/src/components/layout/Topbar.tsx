import { useAuth } from '@/contexts/AuthContext'
import { User, Menu } from 'lucide-react'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827] md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-sm">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3F4F6]">
          <User className="h-3 w-3 text-[#6B7280]" />
        </div>
        <span className="text-[#6B7280]">{user?.name}</span>
      </div>
    </header>
  )
}
