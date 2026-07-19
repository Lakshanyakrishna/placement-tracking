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

// A mentor and a team_leader are also enrolled students, so a dual/triple-role
// person must never see three separate "Dashboard" links. Anyone with mentor
// or team_leader role gets a single link to the hub page instead (which shows
// a small preview tile per role they hold); the direct student dashboard link
// only appears for plain students who have neither of those roles.
const hubNavItem: NavItem = {
  label: 'Dashboard',
  href: ROUTES.DASHBOARD_HUB,
  icon: <LayoutDashboard className="h-4 w-4" />,
  roles: [ROLES.MENTOR, ROLES.TEAM_LEADER],
}

const otherNavItems: NavItem[] = [
  { label: 'Certifications', href: ROUTES.ADMIN_OPPORTUNITIES, icon: <Briefcase className="h-4 w-4" />, roles: [ROLES.MENTOR, ROLES.TEAM_LEADER] },
  { label: 'Dashboard', href: ROUTES.STUDENT_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Certifications', href: ROUTES.STUDENT_CERTIFICATIONS, icon: <GraduationCap className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Placements', href: ROUTES.STUDENT_PLACEMENTS, icon: <Building2 className="h-4 w-4" />, roles: ['student'] },
  { label: 'My Submissions', href: ROUTES.STUDENT_SUBMISSIONS, icon: <FileText className="h-4 w-4" />, roles: ['student'] },
  { label: 'Profile', href: ROUTES.STUDENT_PROFILE, icon: <Users className="h-4 w-4" />, roles: ['student'] },
]

const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: 'Placement Officer',
  [ROLES.MENTOR]: 'Mentor',
  [ROLES.TEAM_LEADER]: 'Team Leader',
  student: 'Student',
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface SidebarProps {
  /** Mobile off-canvas drawer state — ignored at md+ where the sidebar is
   * always visible in normal flow. */
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userRoles = [...(user?.roles ?? [])]
  if (user?.isStudent) userRoles.push('student')

  const primaryRoleLabel = ROLE_LABELS[userRoles[0]] ?? 'Member'
  const hasHub = userRoles.includes(ROLES.MENTOR) || userRoles.includes(ROLES.TEAM_LEADER)

  const navItems = [
    ...adminNavItems,
    ...(hasHub ? [hubNavItem] : []),
    ...otherNavItems.filter((item) => !(hasHub && item.href === ROUTES.STUDENT_DASHBOARD)),
  ]
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
    <>
      {/* Backdrop — mobile-only, closes the drawer on outside tap */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-300 md:static md:z-auto md:w-56 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-stmary-gradient text-[10px] font-bold text-white shadow-sm">
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
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-stmary-gradient text-white shadow-sm'
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
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stmary-gradient text-xs font-semibold text-white shadow-sm">
              {user?.name ? initials(user.name) : '?'}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium text-[#111827]">{user?.name}</p>
              <p className="text-[10px] text-[#6B7280]">{primaryRoleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
