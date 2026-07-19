export const ROLES = {
  ADMIN: 'admin',
  MENTOR: 'mentor',
  TEAM_LEADER: 'team_leader',
  STUDENT: 'student',
} as const

// Types reserved for the placement officer (admin): recruitment drives that
// must be identical across every group, shown under "My Placements" rather
// than "My Certifications".
export const PLACEMENT_OFFICER_TYPES = ['placement', 'internship'] as const

export function isPlacementType(opportunityType: string): boolean {
  return (PLACEMENT_OFFICER_TYPES as readonly string[]).includes(opportunityType)
}

export const OPPORTUNITY_STATES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  OPEN: 'open',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled',
} as const

export const PARTICIPATION_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
  REJECTED: 'rejected',
} as const

export const ROUTES = {
  LOGIN: '/login',
  HELP: '/help',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_OPPORTUNITIES: '/admin/opportunities',
  ADMIN_OPPORTUNITIES_NEW: '/admin/opportunities/new',
  ADMIN_OPPORTUNITIES_EDIT: (id: string) => `/admin/opportunities/${id}/edit`,
  ADMIN_OPPORTUNITIES_ANALYTICS: (id: string) => `/admin/opportunities/${id}/analytics`,
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_VERIFICATIONS: '/admin/verifications',
  ADMIN_REPORTS: '/admin/reports',
  DASHBOARD_HUB: '/dashboard',
  MENTOR_DASHBOARD: '/mentor/dashboard',
  TEAM_LEADER_DASHBOARD: '/team-leader/dashboard',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_CERTIFICATIONS: '/student/certifications',
  STUDENT_PLACEMENTS: '/student/placements',
  STUDENT_SUBMISSIONS: '/student/submissions',
  STUDENT_PROFILE: '/student/profile',
} as const

export const ROLE_DASHBOARD_MAP: Record<string, string> = {
  [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.MENTOR]: ROUTES.DASHBOARD_HUB,
  [ROLES.TEAM_LEADER]: ROUTES.DASHBOARD_HUB,
  [ROLES.STUDENT]: ROUTES.STUDENT_DASHBOARD,
}

export const STATUS_COLORS: Record<string, string> = {
  [PARTICIPATION_STATUSES.NOT_STARTED]: 'bg-gray-100 text-gray-800',
  [PARTICIPATION_STATUSES.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [PARTICIPATION_STATUSES.SUBMITTED]: 'bg-yellow-100 text-yellow-800',
  [PARTICIPATION_STATUSES.VERIFIED]: 'bg-green-100 text-green-800',
  [PARTICIPATION_STATUSES.COMPLETED]: 'bg-emerald-100 text-emerald-800',
  [PARTICIPATION_STATUSES.INCOMPLETE]: 'bg-orange-100 text-orange-800',
  [PARTICIPATION_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
}
