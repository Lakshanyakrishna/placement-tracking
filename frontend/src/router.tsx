import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { ROLES } from '@/lib/constants'

import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import MentorDashboardPage from '@/pages/mentor/DashboardPage'
import TeamLeaderDashboardPage from '@/pages/team-leader/DashboardPage'
import StudentDashboardPage from '@/pages/student/DashboardPage'
import CertificationsPage from '@/pages/student/CertificationsPage'
import PlacementsPage from '@/pages/student/PlacementsPage'
import SubmissionsPage from '@/pages/student/SubmissionsPage'
import ProfilePage from '@/pages/student/ProfilePage'
import OpportunityListPage from '@/pages/opportunities/ListPage'
import OpportunityCreatePage from '@/pages/opportunities/CreatePage'
import OpportunityEditPage from '@/pages/opportunities/EditPage'
import StudentsListPage from '@/pages/admin/students/ListPage'
import VerificationsListPage from '@/pages/admin/verifications/ListPage'
import ReportsListPage from '@/pages/admin/reports/ListPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    index: true,
    element: <LandingPage />,
  },
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    element: <AppShell />,
    children: [
      {
        path: 'admin/dashboard',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/students',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <StudentsListPage />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/opportunities',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MENTOR, ROLES.TEAM_LEADER]}>
            <OpportunityListPage />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/opportunities/new',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MENTOR, ROLES.TEAM_LEADER]}>
            <OpportunityCreatePage />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/opportunities/:id/edit',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MENTOR, ROLES.TEAM_LEADER]}>
            <OpportunityEditPage />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/verifications',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <VerificationsListPage />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/reports',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <ReportsListPage />
          </RoleGuard>
        ),
      },
      {
        path: 'mentor/dashboard',
        element: (
          <RoleGuard allowedRoles={[ROLES.MENTOR]}>
            <MentorDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: 'team-leader/dashboard',
        element: (
          <RoleGuard allowedRoles={[ROLES.TEAM_LEADER]}>
            <TeamLeaderDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: 'student/dashboard',
        element: (
          <RoleGuard allowedRoles={['student']}>
            <StudentDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: 'student/certifications',
        element: (
          <RoleGuard allowedRoles={['student']}>
            <CertificationsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'student/placements',
        element: (
          <RoleGuard allowedRoles={['student']}>
            <PlacementsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'student/submissions',
        element: (
          <RoleGuard allowedRoles={['student']}>
            <SubmissionsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'student/profile',
        element: (
          <RoleGuard allowedRoles={['student']}>
            <ProfilePage />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
