# Frontend MVP Architecture

## 1. Folder Structure

```
src/
├── api/
│   ├── client.ts                 # Axios instance, interceptors, token refresh
│   ├── auth.api.ts
│   ├── opportunities.api.ts
│   ├── participations.api.ts
│   ├── submissions.api.ts
│   ├── verifications.api.ts
│   └── dashboard.api.ts
├── hooks/
│   ├── useAuth.ts                # login, logout, refresh, currentUser
│   ├── useOpportunities.ts       # useQuery / useMutation wrappers
│   ├── useParticipations.ts
│   ├── useSubmissions.ts
│   ├── useVerifications.ts
│   └── useDashboard.ts
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/
│   │   ├── AppShell.tsx          # sidebar + topbar + <Outlet />
│   │   ├── Sidebar.tsx           # role-aware navigation items
│   │   ├── Topbar.tsx            # user avatar, logout button
│   │   └── RoleGuard.tsx         # redirect if wrong role
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── opportunities/
│   │   ├── OpportunityTable.tsx
│   │   ├── OpportunityForm.tsx
│   │   └── PublishButton.tsx
│   ├── participations/
│   │   ├── ParticipationCard.tsx
│   │   └── StatusBadge.tsx
│   ├── submissions/
│   │   ├── SubmissionUpload.tsx
│   │   └── FileList.tsx
│   ├── verifications/
│   │   ├── PendingList.tsx
│   │   └── VerdictButtons.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── StatGrid.tsx
│   │   ├── AdminMetrics.tsx
│   │   ├── MentorMetrics.tsx
│   │   ├── TeamLeaderMetrics.tsx
│   │   └── StudentMetrics.tsx
│   └── shared/
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       ├── LoadingSpinner.tsx
│       └── ConfirmDialog.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── admin/
│   │   └── DashboardPage.tsx
│   ├── mentor/
│   │   └── DashboardPage.tsx
│   ├── team-leader/
│   │   └── DashboardPage.tsx
│   ├── student/
│   │   └── DashboardPage.tsx
│   ├── opportunities/
│   │   ├── ListPage.tsx
│   │   ├── CreatePage.tsx
│   │   └── EditPage.tsx
│   └── NotFoundPage.tsx
├── lib/
│   ├── utils.ts                  # cn() helper
│   └── constants.ts              # role enums, status maps, route paths
├── contexts/
│   └── AuthContext.tsx
├── types/
│   ├── auth.ts
│   ├── opportunity.ts
│   ├── participation.ts
│   ├── submission.ts
│   ├── verification.ts
│   └── dashboard.ts
├── router.tsx                    # createBrowserRouter definition
├── App.tsx
├── main.tsx
├── index.css
└── vite-env.d.ts
```

---

## 2. Routing Structure

```
/login                                    LoginPage        (public)
/                                         redirect → role-specific dashboard
/admin/dashboard                          AdminDashboardPage
/admin/opportunities                      OpportunityListPage
/admin/opportunities/new                  OpportunityCreatePage
/admin/opportunities/:id/edit             OpportunityEditPage
/mentor/dashboard                         MentorDashboardPage
/team-leader/dashboard                    TeamLeaderDashboardPage
/student/dashboard                        StudentDashboardPage
*                                         NotFoundPage
```

- All routes except `/login` wrapped in `AppShell` (sidebar + topbar).
- `RoleGuard` component checks `user.roles` from AuthContext; redirects on mismatch.
- `/` root redirect uses a small utility that picks the first matching route from the user's roles.

---

## 3. Component Tree per Screen

### LoginPage
```
LoginPage
 └── LoginForm
      ├── EmailInput
      ├── PasswordInput
      └── SubmitButton
```

### AdminDashboardPage
```
AdminDashboardPage
 └── StatGrid
      ├── StatCard (Total Students)
      ├── StatCard (Total Opportunities)
      ├── StatCard (Active Opportunities)
      ├── StatCard (Participations)
      ├── StatCard (Submitted)
      ├── StatCard (Verified)
      ├── StatCard (Rejected)
      └── StatCard (Completion Rate)
```

### MentorDashboardPage
```
MentorDashboardPage
 └── StatGrid
      ├── StatCard (Assigned Sections)
      ├── StatCard (Total Students)
      ├── StatCard (Opportunities Active)
      ├── StatCard (Submitted)
      ├── StatCard (Verified)
      ├── StatCard (Rejected)
      └── StatCard (Completion Rate)
```

### TeamLeaderDashboardPage
```
TeamLeaderDashboardPage
 ├── StatGrid
 │    ├── StatCard (Assigned Groups)
 │    ├── StatCard (Students)
 │    ├── StatCard (Pending Verifications)
 │    ├── StatCard (Verified)
 │    └── StatCard (Rejected)
 └── PendingList
      └── PendingListRow × N
           └── VerdictButtons
                ├── ApproveButton
                └── RejectButton (opens ConfirmDialog)
```

### StudentDashboardPage
```
StudentDashboardPage
 ├── StatGrid
 │    ├── StatCard (Assigned Opportunities)
 │    ├── StatCard (In Progress)
 │    ├── StatCard (Submitted)
 │    ├── StatCard (Verified)
 │    └── StatCard (Completed)
 └── ParticipationCard × N
      ├── StatusBadge
      └── SubmissionUpload (if status === 'in_progress')
           └── FileList
```

### OpportunityListPage
```
OpportunityListPage
 ├── CreateButton → /admin/opportunities/new
 └── DataTable
      └── Row × N
           ├── Title / Type / State / Dates
           ├── EditLink → /admin/opportunities/:id/edit
           └── PublishButton (if state === 'draft')
```

### OpportunityCreatePage / OpportunityEditPage
```
OpportunityCreatePage
 └── OpportunityForm
      ├── TitleInput
      ├── TypeSelect
      ├── DescriptionTextarea
      ├── DatePickers (opensAt, closesAt)
      ├── TargetsSelector (branch/section/group/batch)
      └── SubmitButton
```

---

## 4. API Service Design

### Axios Client (`api/client.ts`)
- Base URL from env `VITE_API_BASE_URL` (default `/api/v1`).
- Request interceptor attaches `Authorization: Bearer <accessToken>` from AuthContext.
- Response interceptor catches 401, attempts silent refresh via `POST /auth/refresh` (cookie), retries original request. On refresh failure, clears auth and redirects to `/login`.

### API Modules

Each module exports plain functions that call `client.get/post/patch/delete`. No React coupling.

| Module | Functions |
|--------|-----------|
| `auth.api` | `login(email, password)`, `logout()`, `refresh()`, `forgotPassword(email)`, `resetPassword(token, password)` |
| `dashboard.api` | `getAdmin()`, `getMentor()`, `getTeamLeader()`, `getStudent()` |
| `opportunities.api` | `list(query?)`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`, `publish(id)`, `archive(id)`, `setTargets(id, dto)`, `getTargets(id)` |
| `participations.api` | `list(query?)`, `getById(id)`, `create(dto)`, `updateStatus(id, dto)` |
| `submissions.api` | `create(participationId, files, description)`, `getByParticipation(id)`, `delete(id)`, `getFileDownloadUrl(fileId)` |
| `verifications.api` | `getPending()`, `approve(submissionId)`, `reject(submissionId, reason)`, `getByGroup(id)`, `getBySection(id)`, `getBySubmission(id)` |

### React Query Hooks

Each `use*` hook wraps the API functions with `useQuery` / `useMutation`.

Key patterns:

```
useAdminDashboard()        → useQuery(['dashboard', 'admin'], api.getAdmin)
useMentorDashboard()       → useQuery(['dashboard', 'mentor'], () => api.getMentor())
useOpportunities(filters)  → useQuery(['opportunities', filters], () => api.list(filters))
useCreateOpportunity()     → useMutation(api.create, { onSuccess: invalidation })
usePublishOpportunity()    → useMutation(api.publish, { onSuccess: invalidation })
usePendingVerifications()  → useQuery(['verifications', 'pending'], api.getPending)
useApproveSubmission()     → useMutation(api.approve, { onSuccess: ['verifications', 'pending'] })
useRejectSubmission()      → useMutation(api.reject, { onSuccess: ['verifications', 'pending'] })
useCreateSubmission()      → useMutation(api.create, { onSuccess: ['participations'] })
```

**Query key convention:** `['resource', ...params]` — enables precise invalidation after mutations.

---

## 5. State Management Strategy

| State Category | Tool | Notes |
|----------------|------|-------|
| **Server state** (data from API) | React Query | All GET responses cached/refetched by React Query. Mutations auto-invalidate affected keys. |
| **Auth state** (current user, tokens) | React Context (`AuthContext`) | Tokens stored in memory (access) + httpOnly cookie (refresh). AuthContext provides `user`, `login()`, `logout()`, `isAuthenticated`. Persisted to localStorage for page reload — only the user object, never raw tokens. |
| **UI state** (modals, toasts, sidebar open) | React `useState` / `useReducer` within components | Passed as props; no global store needed for MVP. `react-hot-toast` or sonner for toasts. |
| **Form state** | React Hook Form + Zod | Validation schemas co-located with each form; `useForm` + `zodResolver`. |

**Auth flow:**
1. `POST /auth/login` → server sets httpOnly `refreshToken` cookie, returns `{ accessToken, user }`.
2. Store `accessToken` in memory (AuthContext state), `user` in context + localStorage.
3. Axios interceptor attaches `Bearer <accessToken>` to every request.
4. On 401, interceptor calls `POST /auth/refresh` (cookie sent automatically). On success, replaces in-memory token and retries. On failure, calls `logout()`.
5. On app mount, AuthContext calls `GET /auth/me` using the refresh cookie to hydrate session.

---

## 6. Screen Architecture Diagram

```
Layout
├── Public
│    └── LoginPage
└── Authenticated (AppShell)
     ├── Admin
     │    ├── DashboardPage
     │    └── Opportunities
     │         ├── ListPage
     │         ├── CreatePage
     │         └── EditPage
     ├── Mentor
     │    └── DashboardPage
     ├── TeamLeader
     │    └── DashboardPage
     └── Student
          └── DashboardPage
```

**AppShell** layout:
```
┌─────────────────────────────────────┐
│  Topbar (user menu, logout)         │
├──────────┬──────────────────────────┤
│ Sidebar  │ <Outlet />               │
│ (nav)    │ (page content)           │
│          │                          │
└──────────┴──────────────────────────┘
```

Sidebar items are filtered by role:

| Role | Nav Items |
|------|-----------|
| admin | Dashboard, Opportunities |
| mentor | Dashboard |
| team_leader | Dashboard |
| student | Dashboard |

---

## 7. Type Definitions (key shapes)

```typescript
// auth
interface User { id: string; email: string; name: string; roles: string[]; isStudent?: boolean; }
interface LoginResponse { accessToken: string; user: User; }

// dashboard
interface AdminDashboard { totalStudents: number; totalOpportunities: number; activeOpportunities: number; participations: number; submitted: number; verified: number; rejected: number; completionRate: number; }
interface MentorDashboard { assignedSections: number; totalStudents: number; opportunitiesActive: number; submitted: number; verified: number; rejected: number; completionRate: number; }
interface TeamLeaderDashboard { assignedGroups: number; students: number; pendingVerifications: number; verified: number; rejected: number; }
interface StudentDashboard { assignedOpportunities: number; inProgress: number; submitted: number; verified: number; completed: number; }

// opportunity
interface Opportunity { id: string; title: string; opportunityType: string; state: string; description: string; opensAt: string | null; closesAt: string | null; createdAt: string; createdBy: string; }

// participation
interface Participation { id: string; opportunityId: string; enrollmentId: string; status: string; teamLeaderUserId: string | null; startedAt: string | null; submittedAt: string | null; verifiedAt: string | null; }

// submission (for file upload)
interface SubmissionFile { id: string; fileName: string; fileSize: number; mimeType: string; }

// verification
interface PendingSubmission { submissionId: string; participationId: string; opportunityTitle: string; studentName: string; studentEmail: string; submittedAt: string; description: string | null; fileCount: number; }
```

---

## 8. Key Design Decisions

- **No global state library** — React Query handles server state; AuthContext handles auth; component-local state handles UI. Redux/Zustand are unnecessary for this scope.
- **File uploads** — `multipart/form-data` via Axios `FormData`. The `useCreateSubmission` mutation accepts `(participationId: string, files: File[], description?: string)`. Progress tracking via `axios.onUploadProgress` optional for MVP.
- **Role-based routing** — `RoleGuard` reads `user.roles` and `user.isStudent`, matches against route's `allowedRoles` metadata. Redirects to appropriate dashboard on mismatch.
- **Pagination** — `DataTable` component accepts `page`, `limit`, `total` from API's `PaginationMetaDto`; emits `onPageChange`. React Query keys include page/filter params.
- **Error handling** — Axios interceptor normalizes errors to `{ message: string, statusCode: number }`. React Query's `onError` shows toast. Individual components can catch and display inline errors via `ErrorState`.
- **Empty states** — Every list/data view renders `EmptyState` when data is an empty array, with a relevant illustration and CTA.
