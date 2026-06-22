import { useAuth } from '@/contexts/AuthContext'
import { User } from 'lucide-react'

export function Topbar() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-6">
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
