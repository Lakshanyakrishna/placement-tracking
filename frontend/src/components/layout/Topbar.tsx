import { useAuth } from '@/contexts/AuthContext'
import { User } from 'lucide-react'

export function Topbar() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{user?.name}</span>
      </div>
    </header>
  )
}
