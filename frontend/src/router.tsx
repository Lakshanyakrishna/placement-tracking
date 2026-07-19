import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ROLES } from '@/lib/constants'

// LandingPage and NotFoundPage stay as regular (eager) imports — they're small,
// public, and needed on first paint. Login now happens in a modal on the landing
// page itself (see pages/landing/LoginModal.tsx) rather than a separate route —
// a first-time visitor to "/" only downloads the landing page's own code, not the
// entire authenticated app — this is the difference between an ~80 and a 90+
// Lighthouse performance score on this bundle.
import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'

const HelpPage = lazy(() => import('@/pages/HelpPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const MentorDashboardPage = lazy(() => import('@/pages/mentor/DashboardPage'))
const TeamLeaderDashboardPage = lazy(() => import('@/pages/team-leader/DashboardPage'))
const StudentDashboardPage = lazy(() => import('@/pages/student/DashboardPage'))
const CertificationsPage = lazy(() => import('@/pages/student/CertificationsPage'))
const PlacementsPage = lazy(() => import('@/pages/student/PlacementsPage'))
const SubmissionsPage = lazy(() => import('@/pages/student/SubmissionsPage'))
const ProfilePage = lazy(() => import('@/pages/student/ProfilePage'))
const OpportunityListPage = lazy(() => import('@/pages/opportunities/ListPage'))
const OpportunityCreatePage = lazy(() => import('@/pages/opportunities/CreatePage'))
const OpportunityEditPage = lazy(() => import('@/pages/opportunities/EditPage'))
const OpportunityAnalyticsPage = lazy(() => import('@/pages/opportunities/AnalyticsPage'))
const StudentsListPage = lazy(() => import('@/pages/admin/students/ListPage'))
const VerificationsListPage = lazy(() => import('@/pages/admin/verifications/ListPage'))
const ReportsListPage = lazy(() => import('@/pages/admin/reports/ListPage'))

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<LoadingSpinner fullPage />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  {
    index: true,
    element: <LandingPage />,
  },
  {
    // Kept for anyone with an old /login bookmark or link — redirects to the
    // landing page with the login modal open.
    path: 'login',
    element: <Navigate to="/?login=true" replace />,
  },
  {
    path: 'help',
    element: withSuspense(<HelpPage />),
  },
  {
    element: <AppShell />,
    children: [
      {
        path: 'admin/dashboard',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboardPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'admin/students',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <StudentsListPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'admin/opportunities',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MENTOR, ROLES.TEAM_LEADER]}>
            <OpportunityListPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'admin/opportunities/new',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MENTOR, ROLES.TEAM_LEADER]}>
            <OpportunityCreatePage />
          </RoleGuard>,
        ),
      },
      {
        path: 'admin/opportunities/:id/edit',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MENTOR, ROLES.TEAM_LEADER]}>
            <OpportunityEditPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'admin/opportunities/:id/analytics',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MENTOR, ROLES.TEAM_LEADER]}>
            <OpportunityAnalyticsPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'admin/verifications',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <VerificationsListPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'admin/reports',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <ReportsListPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'mentor/dashboard',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.MENTOR]}>
            <MentorDashboardPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'team-leader/dashboard',
        element: withSuspense(
          <RoleGuard allowedRoles={[ROLES.TEAM_LEADER]}>
            <TeamLeaderDashboardPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'student/dashboard',
        element: withSuspense(
          <RoleGuard allowedRoles={['student']}>
            <StudentDashboardPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'student/certifications',
        element: withSuspense(
          <RoleGuard allowedRoles={['student']}>
            <CertificationsPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'student/placements',
        element: withSuspense(
          <RoleGuard allowedRoles={['student']}>
            <PlacementsPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'student/submissions',
        element: withSuspense(
          <RoleGuard allowedRoles={['student']}>
            <SubmissionsPage />
          </RoleGuard>,
        ),
      },
      {
        path: 'student/profile',
        element: withSuspense(
          <RoleGuard allowedRoles={['student']}>
            <ProfilePage />
          </RoleGuard>,
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
