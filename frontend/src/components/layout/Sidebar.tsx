import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Briefcase, ShieldCheck, FileText, LogOut, GraduationCap, Building2 } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Students', href: ROUTES.ADMIN_STUDENTS, icon: <Users className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Opportunities', href: ROUTES.ADMIN_OPPORTUNITIES, icon: <Briefcase className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Verifications', href: ROUTES.ADMIN_VERIFICATIONS, icon: <ShieldCheck className="h-4 w-4" />, roles: [ROLES.ADMIN] },
  { label: 'Reports', href: ROUTES.ADMIN_REPORTS, icon: <FileText className="h-4 w-4" />, roles: [ROLES.ADMIN] },
]

const otherNavItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.MENTOR_DASHBOARD, icon: <ShieldCheck className="h-4 w-4" />, roles: [ROLES.MENTOR] },
  { label: 'Dashboard', href: ROUTES.TEAM_LEADER_DASHBOARD, icon: <Users className="h-4 w-4" />, roles: [ROLES.TEAM_LEADER] },
  { label: 'Certifications', href: ROUTES.ADMIN_OPPORTUNITIES, icon: <Briefcase className="h-4 w-4" />, roles: [ROLES.MENTOR, ROLES.TEAM_LEADER] },
  { label: 'Dashboard', href: ROUTES.STUDENT_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Certifications', href: ROUTES.STUDENT_CERTIFICATIONS, icon: <GraduationCap className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Placements', href: ROUTES.STUDENT_PLACEMENTS, icon: <Building2 className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Submissions', href: ROUTES.STUDENT_SUBMISSIONS, icon: <FileText className="h-4 w-4" />, roles: ['student'] },
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
    // Navigate first: this unmounts RoleGuard/the current protected page immediately,
    // so its reactive "user became unauthenticated -> redirect to /login" logic never
    // fires and can't race with (and win over) this explicit redirect to the landing
    // page. Client-side navigation doesn't cancel the in-flight logout API call.
    navigate('/')
    await logout()
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-white">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#B91C1C] text-[10px] font-bold text-white">
          SM
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-[#111827]">St. Mary&apos;s</p>
          <p className="text-[10px] text-[#6B7280]">Career Hub</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {visible.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#FEF2F2] text-[#B91C1C]'
                  : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
