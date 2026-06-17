import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Briefcase, ShieldCheck, GraduationCap, FileText, LogOut } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Students', href: ROUTES.ADMIN_STUDENTS, icon: <Users className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Certification Opportunities', href: ROUTES.ADMIN_OPPORTUNITIES, icon: <Briefcase className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Verifications', href: ROUTES.ADMIN_VERIFICATIONS, icon: <ShieldCheck className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Reports', href: ROUTES.ADMIN_REPORTS, icon: <FileText className="h-4 w-4" />, roles: [ROLES.ADMIN] },
]

const otherNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.MENTOR_DASHBOARD,
    icon: <ShieldCheck className="h-4 w-4" />,
    roles: [ROLES.MENTOR],
  },
  {
    label: 'Dashboard',
    href: ROUTES.TEAM_LEADER_DASHBOARD,
    icon: <Users className="h-4 w-4" />,
    roles: [ROLES.TEAM_LEADER],
  },
  { label: 'Dashboard', href: ROUTES.STUDENT_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Certifications', href: ROUTES.STUDENT_CERTIFICATIONS, icon: <Briefcase className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Submissions', href: ROUTES.STUDENT_SUBMISSIONS, icon: <ShieldCheck className="h-4 w-4" />, roles: ['student'] },
  { label: 'Profile', href: ROUTES.STUDENT_PROFILE, icon: <Users className="h-4 w-4" />, roles: ['student'] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userRoles = [...(user?.roles ?? [])]
  if (user?.isStudent) userRoles.push('student')

  const navItems = [...adminNavItems, ...otherNavItems]
  const visible = navItems.filter((item) => item.roles.some((r) => userRoles.includes(r)))

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar-background text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-stmarys text-[10px] font-bold text-white">
          SM
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold">St. Mary's</p>
          <p className="text-[10px] text-muted-foreground">Career Hub</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visible.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
