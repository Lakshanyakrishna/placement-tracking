# Placement Opportunity Tracking and Monitoring System — Final Architecture Document

> **Version:** 1.0  
> **Status:** Approved  
> **Scope:** Source of truth for database design, bounded context definition, and integration contracts  
> **Audience:** Engineering team, technical leads, database designers

---

## 1. System Context

### 1.1 Purpose

A platform for colleges to publish placement/training opportunities, track student participation and completion, enforce accountability through mentors and team leaders, and provide analytics across batches, branches, sections, and groups.

### 1.2 Scale Targets

| Dimension | Lower Bound | Upper Bound |
|---|---|---|
| Students | 1,000 | 5,000 |
| Concurrent batches | 1 | 4 |
| Mentors | 10 | 100 |
| Team Leaders | 20 | 400 |
| Opportunities per period | 10 | 200 |
| Submissions per opportunity | 100 | 2,000 |

### 1.3 Core Constraints

- The platform does **not** conduct training — it tracks participation in externally conducted opportunities.
- Every authenticated user has a base identity (User). Enrollment (student status) and functional roles are separate concerns.
- Multi-tenancy is implicit (single college, but departments/batches act as semi-autonomous units).

### 1.4 Architecture Style

**Modular Monolith with Domain-Driven Bounded Contexts**, deployable as a monolith initially with clear module boundaries that allow future service decomposition. Communication between contexts is via in-process domain events (async via message bus).

---

## 2. Domain Model Overview

The system is decomposed into four bounded contexts:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                            │
│  Authentication (JWT validation) │ Authorization (Policy Decision)  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────┐   ┌───────────────────────┐   ┌──────────────────┐
│  Identity &       │   │  Opportunity          │   │  Analytics &     │
│  Access Context   │   │  Management Context   │   │  Reporting       │
│                   │   │                       │   │  Context         │
│  User management  │   │  Opportunity lifecycle│   │                  │
│  Role assignments │   │  Target assignments   │   │  Read-only       │
│  Enrollments      │   │  Publishing workflow  │   │  Aggregations    │
│  Academic struct  │   │                       │   │  Dashboards      │
└────────┬──────────┘   └───────────┬───────────┘   └────────┬─────────┘
         │                          │                         │
         │                          │                         │
         ▼                          ▼                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          Shared Kernel                               │
│  AcademicPeriod │ FileReference │ DomainEvent │ ValueObjects         │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                     │
│  Normalized write schema │ Materialized views │ Event store (audit)  │
│  Partitioned by period (relevant tables)                              │
└──────────────────────────────────────────────────────────────────────┘
```

**Event Flow Between Contexts:**

| Event | Publisher | Subscriber(s) |
|---|---|---|
| OpportunityPublished | Opportunity | Identity (notify targets) |
| OpportunityOpened | Opportunity | Analytics (refresh views) |
| SubmissionCreated | Verification | Analytics, Identity |
| SubmissionVerified | Verification | Analytics, Identity |
| SubmissionAutoVerified | Verification | Analytics, Identity |
| MentorAssigned | Identity | Opportunity (scoping) |
| PeriodActivated | Identity | All contexts |

---

## 3. Identity Model

### 3.1 Principles

1. **User is a pure identity** — it carries no role, no enrollment, no batch association. It authenticates and is the subject of all authorization decisions.
2. **Enrollment** models the "is a student" relationship to an academic structure for a given period. A User may have zero enrollments (staff-only), one, or multiple (cross-batch situations).
3. **RoleAssignment** models functional authority — it is scoped to an entity (section, group, or global) and has a validity window.

### 3.2 Entities

#### User

| Attribute | Type | Notes |
|---|---|---|
| id | UUID | Primary identifier |
| email | String | Login identifier; also used for notifications |
| password_hash | String | Bcrypt/PBKDF2 |
| name | String | Full display name |
| contact_phone | String? | Optional |
| is_active | Boolean | Soft disable — prevents login, preserves data |
| created_at | Timestamp | |
| updated_at | Timestamp | |

**Why this entity exists:** Every interaction in the system traces to a User. Separating identity from role prevents the "graduated student who becomes a mentor needs split identity" problem. A User's record persists across all batches and roles.

#### Enrollment

| Attribute | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → User |
| academic_period_id | UUID | FK → AcademicPeriod |
| branch_id | UUID | FK → Branch |
| section_id | UUID | FK → Section |
| group_id | UUID? | Nullable; students not yet assigned to group |
| roll_number | String | Student identifier (display/legacy only; not auth principal) |
| is_active | Boolean | Allows removing a student from a period without deleting data |
| enrolled_at | Timestamp | |

**Why this entity exists:** A User becomes a "student" only through Enrollment. This decouples identity from academic context. A user may be enrolled in multiple periods (e.g., backlog subjects across years). When a student graduates, their Enrollment ends but their User record remains available for future roles (alumni mentor).

#### RoleAssignment

| Attribute | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → User |
| role | Enum | `admin`, `mentor`, `team_leader` |
| scope_type | Enum | `global`, `section`, `group`, `opportunity` |
| scope_id | UUID | ID of the scoping entity |
| granted_by | UUID | FK → User (admin who assigned) |
| valid_from | Timestamp | |
| valid_to | Timestamp? | Null = no expiry |
| created_at | Timestamp | |

**Why this entity exists:** Flat role enums (admin/user) cannot express "Mentor of Section A" or "Team Leader of Group B." This entity encodes the scope explicitly, enabling the Policy Decision Point to evaluate authorization without hardcoded conditional chains.

**Invariants:**
- A RoleAssignment with `scope_type=global` and `role=admin` grants system-wide access.
- A `role=mentor` assignment must have `scope_type=section` (mentors own sections).
- A `role=team_leader` assignment must have `scope_type=group` (TLs own groups).
- A user may have multiple RoleAssignments (e.g., Mentor of Section A + Team Leader of Group B within Section A).

---

## 4. Authorization Model

### 4.1 Decision: Hybrid ABAC + Scoped RBAC

**Use RBAC for role hierarchy** (admin > mentor > team leader), **use ABAC for resource-level conditions** (scope, ownership, period, state).

| Aspect | Approach |
|---|---|
| Role assignment | RBAC — roles are predefined, assigned with scope |
| Permission evaluation | ABAC — policy evaluates User attributes + Resource attributes + Environment |
| Scope isolation | ABAC attribute: `scope_type + scope_id` |
| Ownership checks | ABAC attribute: `resource.owner_id == user.id` |
| State-dependent access | ABAC attribute: `resource.state in [allowed_states]` |

### 4.2 Policy Decision Point (PDP)

Centralized module that evaluates:

```
authorize(user, action, resource) → bool
```

Evaluation pipeline:
1. Is user active? → deny if no
2. Does user have a RoleAssignment for the required role at the required scope? → deny if no
3. Is the RoleAssignment currently valid? (valid_from <= now < valid_to) → deny if expired
4. Does the resource state permit this action? → deny if state mismatch
5. Are any additional ABAC conditions met? → deny if not

### 4.3 Role Authority Matrix

| Action | Admin | Mentor | TL | Student |
|---|---|---|---|---|
| Create/Edit/Delete opportunity | ✓ | — | — | — |
| Publish/Close/Archive opportunity | ✓ | — | — | — |
| View analytics (global) | ✓ | — | — | — |
| View analytics (own section) | ✓ | ✓ | — | — |
| View analytics (own group) | ✓ | ✓ | ✓ | ✓ |
| Assign mentors to sections | ✓ | — | — | — |
| Assign TLs to groups | ✓ | — | — | — |
| View submissions (own section) | ✓ | ✓ | — | — |
| View submissions (own group) | ✓ | ✓ | ✓ | — |
| Verify submission (own group) | —* | ✓** | ✓ | — |
| Submit participation | — | — | — | ✓ |
| Upload proof | — | — | — | ✓ |
| Escalate verification | ✓ | ✓ | ✓ | ✓ |
| Manage academic structure | ✓ | — | — | — |
| Manage enrollments (bulk) | ✓ | — | — | — |

*\* Admin can verify in escalation path only.  
** Mentor can override TL verification or step in when TL is inactive.*

### 4.4 Why Not Pure RBAC, Why Not Pure ABAC

**Pure RBAC fails** because the same role (Mentor) needs different permissions on different resources depending on which section is owned. Role explosion would result (Mentor_SectionA, Mentor_SectionB, ...).

**Pure ABAC fails** because attribute definition and policy maintenance become complex without role categorization. Hybrid reduces policy count by 60%+ compared to ABAC-only in similar systems.

---

## 5. Academic Structure Model

### 5.1 Hierarchy

```
AcademicYear (2025–2026, 2026–2027)
      │
      ▼
AcademicPeriod (Odd Semester 2025, Even Semester 2026, Summer 2026)
      │
      ├── Branch (Computer Science, Electronics, Mechanical...)
      │     │
      │     └── Section (CSE-A, CSE-B, ECE-A...)
      │           │
      │           └── Group (Alpha, Beta, Gamma...)
      │
      └── Batch (2025, 2026, 2027...)
```

### 5.2 Entities

#### AcademicYear

| Attribute | Notes |
|---|---|
| id | UUID |
| label | e.g., "2025–2026" |
| is_active | Exactly one AcademicYear is active at a time |

**Why this entity exists:** Enables rollover. When a new academic year starts, administrators activate the new year. All period-scoped queries filter by the active year automatically. Historical data remains queryable by selecting a previous year.

#### AcademicPeriod

| Attribute | Notes |
|---|---|
| id | UUID |
| academic_year_id | FK → AcademicYear |
| label | e.g., "Odd Semester", "Even Semester", "Summer Term" |
| type | Enum: `semester`, `trimester`, `term` |
| start_date | Date |
| end_date | Date |
| is_active | Boolean |

**Why this entity exists:** Opportunities, enrollments, and role assignments are scoped to an AcademicPeriod. This is the primary time-boxing mechanism. It enables "future batches without redesign" — a new period is just a new record. Period type flexibility allows colleges using trimesters (CBCS) to participate without schema changes.

#### Branch

| Attribute | Notes |
|---|---|
| id | UUID |
| code | e.g., "CSE", "ECE", "MECH" |
| name | e.g., "Computer Science and Engineering" |

**Why this entity exists:** Branches organize students into broad disciplines. Analytics are aggregated by branch. Mentors are typically associated with sections within a branch.

#### Section

| Attribute | Notes |
|---|---|
| id | UUID |
| branch_id | FK → Branch |
| academic_period_id | FK → AcademicPeriod |
| code | e.g., "CSE-A", "CSE-B" |
| mentor_user_id | UUID? | FK → User (nullable; section may be unassigned) |

**Why this entity exists:** Sections are the primary unit of Mentor ownership. A Mentor is assigned to one section (via RoleAssignment), making the section the scope for monitoring and analytics.

#### Group

| Attribute | Notes |
|---|---|
| id | UUID |
| section_id | FK → Section |
| name | e.g., "Alpha", "Group 1" |
| team_leader_user_id | UUID? | FK → User (nullable; group may lack a TL) |

**Why this entity exists:** Groups are the primary unit of Team Leader ownership. Groups are the granular accountability unit — students in a group report to their TL. TLs verify submissions at the group level.

#### Batch

| Attribute | Notes |
|---|---|
| id | UUID |
| academic_year_id | FK → AcademicYear |
| label | e.g., "Batch 2025", "Batch 2026" |
| graduation_year | Integer |

**Why this entity exists:** Batches cut across branches. Analytics commonly filter "all students of Batch 2025" irrespective of branch. Enrollment links a student to a batch.

---

## 6. Opportunity Management Model

### 6.1 Opportunity Lifecycle State Machine

```
                        ┌─────────┐
                        │  Draft  │
                        └────┬────┘
                             │ admin publishes
                             ▼
                      ┌──────────────┐
                      │  Published   │ ← visible to students
                      └──────┬───────┘
                             │ admin opens (or scheduled start)
                             ▼
                      ┌──────────────┐
                      │    Open      │ ← students can submit
                      └──────┬───────┘
                             │ admin closes (or scheduled end)
                             ▼
                      ┌──────────────┐
                      │   Closed     │ ← submissions frozen; verification
                      └──────┬───────┘      in progress
                             │ admin archives
                             ▼
                      ┌──────────────┐
                      │  Archived    │ ← read-only; excluded from
                      └──────────────┘    default analytics
```

**State Transition Rules:**

| From | To | Who | Conditions |
|---|---|---|---|
| Draft | Published | Admin | None |
| Published | Draft | Admin | Only if no submissions received |
| Published | Open | Admin | Or automatic via `opens_at` |
| Open | Closed | Admin | Or automatic via `closes_at` |
| Closed | Open | Admin | Only if verification not yet started |
| Closed | Archived | Admin | After verification deadline |
| Any | Cancelled | Admin | Soft-delete with reason |

### 6.2 Entities

#### Opportunity

| Attribute | Notes |
|---|---|
| id | UUID |
| academic_period_id | UUID | FK → AcademicPeriod |
| title | String |
| description | Text |
| opportunity_type | Enum | `internship`, `placement`, `training`, `workshop`, `hackathon`, `other` |
| state | Enum | Lifecycle state machine |
| created_by | UUID | FK → User (admin) |
| opens_at | Timestamp? | Scheduled open (null = manual) |
| closes_at | Timestamp? | Scheduled close (null = manual) |
| verification_deadline | Interval | e.g., 7 days after close |
| require_proof | Boolean | Whether proof upload is mandatory |
| max_submissions | Integer? | Per student (null = unlimited) |
| allow_group_submission | Boolean | |
| created_at | Timestamp | |
| updated_at | Timestamp | |

**Why this entity exists:** The core entity that everything orbits. Students participate in Opportunities. Opportunities are published per AcademicPeriod, enabling clean separation between years.

#### OpportunityTarget

| Attribute | Notes |
|---|---|
| id | UUID |
| opportunity_id | UUID | FK → Opportunity |
| target_type | Enum | `branch`, `section`, `group`, `batch`, `all` |
| target_id | UUID | ID of the target entity |

**Why this entity exists:** An Opportunity may target specific branches (e.g., "CSE only"), sections, or batches. This many-to-many relationship avoids denormalizing target lists into the Opportunity entity and allows efficient queries for "show me opportunities targeting my section."

#### Participation

| Attribute | Notes |
|---|---|
| id | UUID |
| opportunity_id | UUID | FK → Opportunity |
| enrollment_id | UUID | FK → Enrollment |
| status | Enum | `not_started`, `in_progress`, `submitted`, `verified`, `completed`, `incomplete` |
| team_leader_user_id | UUID? | FK → User; the TL responsible for verification |
| started_at | Timestamp? | |
| submitted_at | Timestamp? | |
| verified_at | Timestamp? | |
| verified_by | UUID? | FK → User |
| notes | Text? | Mentor/admin notes |

**Why this entity exists:** The Participation record bridges an Opportunity and a Student (via Enrollment). It tracks the student's journey through the opportunity, including who is responsible for their verification (the TL assigned to their group at the time).

#### Submission

| Attribute | Notes |
|---|---|
| id | UUID |
| participation_id | UUID | FK → Participation |
| submitted_by | UUID | FK → User (the student) |
| description | Text? | |
| file_references | JSON | Array of file references (see FileReference) |
| external_links | JSON? | Array of URLs |
| submitted_at | Timestamp | |
| is_late | Boolean | Computed: submitted_at > opportunity.closes_at |

**Why this entity exists:** A student may submit multiple times for the same opportunity (e.g., draft → final). Each Submission is a separate row, allowing version history. The Verification system acts on the latest submission unless otherwise specified.

#### FileReference

| Attribute | Notes |
|---|---|
| id | UUID |
| bucket | String |
| key | String | Opaque path in S3 |
| original_filename | String |
| mime_type | String |
| size_bytes | Integer |
| uploaded_by | UUID | FK → User |
| presigned_url_expiry | Timestamp | |

**Why this entity exists:** Decouples file storage from business entities. Multiple Submission/Proof records can reference the same FileReference. Storage provider is abstracted behind the reference.

---

## 7. Verification Workflow

### 7.1 Normal Flow

```
Student submits → Participation.status = 'submitted'
                → Submission record created
                → Domain event: SubmissionCreated
                → TL assigned (from Enrollment.group → Group.team_leader_user_id)
                → Notification to TL: "Verify submission from [Student]"
                
TL reviews → Accept → Participation.status = 'verified'
          →         → Participation.verified_at = now
          →         → Participation.verified_by = TL user ID
          →         → Domain event: SubmissionVerified
          → Reject → Submission.rejection_reason set
          →         → Notification to student: "Submission rejected: [reason]"
          →         → Participation.status returns to 'in_progress'
          →         → Student may resubmit
```

### 7.2 Escalation Flow

```
When submission is in 'submitted' state for > verification_threshold (configurable, default 48h):
  → Domain event: VerificationEscalationTriggered
  → TL notified (reminder)
  → Escalation level increments
  
When escalation level > max_escalations (configurable, default 2):
  → Mentor assigned as verifier (from Section.mentor_user_id)
  → Notification to Mentor: "TL [name] has pending verifications; you are now verifier"
  → Mentor can Accept/Reject
  
When Mentor also misses deadline (configurable, default additional 48h):
  → Admin notified
  → Admin can assign any user as verifier or auto-verify based on proof
```

### 7.3 Auto-Verification Rules

| Condition | Action |
|---|---|
| TL inactive > threshold + max_escalations | Escalate to mentor |
| Mentor inactive > additional threshold | Notify admin |
| Proof provided AND TL inactive > threshold | Auto-verify (configurable per opportunity) |
| Submission deadline passed + verification deadline passed | Auto-mark as `incomplete` (configurable) |

### 7.4 VerificationLog

| Attribute | Notes |
|---|---|
| id | UUID |
| submission_id | UUID | FK → Submission |
| action | Enum | `submitted`, `verified`, `rejected`, `auto_verified`, `escalated`, `overridden` |
| actor_user_id | UUID? | User who performed action (null for system actions) |
| reason | Text? | For rejections or escalations |
| created_at | Timestamp | |

**Why this entity exists:** Immutable log of all verification events. Provides audit trail ("who verified what when"), data for analytics ("average verification time per TL"), and grounds for dispute resolution.

---

## 8. Notification Architecture

### 8.1 Principles

1. **Event-driven:** Notifications are side effects of domain events, not inline in business logic.
2. **Async:** Notification delivery never blocks the request-response cycle.
3. **Multi-channel:** In-app notification as primary channel; email secondary. Design allows future channels (SMS, Slack) without changing business logic.
4. **User opt-out per channel:** Users can disable email notifications for non-essential events.

### 8.2 Architecture

```
Domain Event Bus
      │
      ▼
┌──────────────────────────────────────────────┐
│         Notification Dispatcher              │
│  Maps domain event → notification templates  │
│  Resolves recipients (User IDs from context) │
│  Creates Notification records                │
└──────────┬───────────────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐ ┌──────────┐
│ In-App   │ │ Email    │
│ Channel  │ │ Channel  │
│ (DB)     │ │ (SMTP)   │
└──────────┘ └──────────┘
```

### 8.3 Notification Entity

| Attribute | Notes |
|---|---|
| id | UUID |
| user_id | UUID | FK → User (recipient) |
| type | Enum | `submission_pending`, `submission_verified`, `submission_rejected`, `escalation`, `opportunity_published`, `opportunity_opened`, `mentor_assigned`, `tl_assigned`, `deadline_reminder` |
| title | String | Short localization key or text |
| body | Text | |
| channel | Enum | `in_app`, `email`, `both` |
| delivery_status | Enum | `pending`, `delivered`, `failed` |
| read_at | Timestamp? | Null until read (in-app) |
| created_at | Timestamp | |

**Why this entity exists:** Decouples notification creation from delivery. Failed email deliveries retain the in-app notification. Users have a notification inbox. Read/unread tracking enables badge counts.

---

## 9. Audit Architecture

### 9.1 Principles

1. **Append-only:** Audit records are never updated or deleted.
2. **Immutable:** Once written, audit records should be tamper-evident (via hash chain if compliance requires).
3. **Domain event sourced:** Every meaningful state change emits an event; events are persisted in the audit log.
4. **Separate retention:** Audit data may have different retention policies than operational data.

### 9.2 AuditLog Entity

| Attribute | Notes |
|---|---|
| id | UUID | Sequential for ordering |
| event_type | String | Fully qualified domain event name |
| aggregate_type | String | e.g., "Opportunity", "Participation" |
| aggregate_id | UUID | ID of the entity that changed |
| actor_user_id | UUID? | Who performed the action |
| previous_state | JSON? | Snapshot of state before change |
| new_state | JSON? | Snapshot of state after change |
| metadata | JSON | IP address, user agent, request ID |
| occurred_at | Timestamp | |
| checksum | String? | SHA-256 of previous fields (for tamper evidence) |

**Why this entity exists:** Satisfies the "who approved what when" requirement. Enables compliance audits, debugging, and reconstructing historical state. JSON snapshots allow schema evolution — old audit records remain valid even if the current schema changes.

### 9.3 Events Logged

| Event | Trigger |
|---|---|
| UserCreated | Account registration |
| RoleAssigned | Admin assigns role |
| RoleRevoked | Role validity expires or admin revokes |
| EnrollmentCreated | Student added to batch |
| OpportunityStateChanged | Draft → Published → Open → Closed → Archived |
| SubmissionCreated | Student submits |
| SubmissionVerified | TL/Mentor accepts |
| SubmissionRejected | TL/Mentor rejects |
| VerificationEscalated | System escalation |
| VerificationOverridden | Mentor/admin overrides TL decision |

---

## 10. Analytics Architecture

### 10.1 Approach: CQRS-light with Materialized Views

**Write side:** Normalized relational model (all entities above). All writes go here.

**Read side:** Materialized views refreshed by domain events. Queries for dashboards and reports hit materialized views, not transactional tables.

**Why not a separate read store (Elasticsearch, ClickHouse)?** For 5,000 users, PostgreSQL materialized views with `REFRESH MATERIALIZED VIEW CONCURRENTLY` suffice. Adding a separate store adds operational complexity (syncing, consistency, deployment) without proportional benefit at this scale. The architecture permits swapping to a dedicated read store later if scale demands it.

### 10.2 Refresh Strategy

```
Domain Event → Event Handler → Determine affected aggregate(s)
                              → Refresh relevant materialized views
                              → Views are refreshed CONCURRENTLY
                                (no lock on read)
```

**Refresh trigger:** After each domain event or batch of events (debounced 5 seconds for high-frequency submission events).

### 10.3 Materialized Views

| View | Purpose | Refresh Trigger |
|---|---|---|
| mv_opportunity_summary | Per-opportunity: total target, submitted, verified, completion rate | Opportunity state change, Submission event |
| mv_section_performance | Per-section: counts by opportunity, comparison across periods | Submission event |
| mv_tl_performance | Per-TL: pending count, avg verification time, escalation rate | Verification event |
| mv_student_progress | Per-student: tracked opportunities, completion %, classification | Any Participation/Submission event |
| mv_batch_comparison | Cross-batch comparison of participation and completion | End-of-period rollup |

### 10.4 Analytics API

Read-only API that queries materialized views. Never queries transactional tables directly for aggregations.

```
GET /analytics/dashboard/section?section_id=X&period_id=Y
GET /analytics/reports/opportunity/{id}/completion
GET /analytics/reports/batch/{id}/overview
GET /analytics/export/opportunity/{id}/submissions (CSV)
```

---

## 11. Final Entity List

### Identity & Access Context

| # | Entity | Type | Purpose |
|---|---|---|---|
| 1 | User | Aggregate Root | Base identity for all authenticated users |
| 2 | Enrollment | Entity | Links a User as a student to an academic period/branch/section/group |
| 3 | RoleAssignment | Value Object | Grants a role to a User with scope and validity period |
| 4 | AuditLog | Entity | Immutable record of all state-changing events |

### Academic Structure Context

| # | Entity | Type | Purpose |
|---|---|---|---|
| 5 | AcademicYear | Aggregate Root | Top-level time container for an academic year |
| 6 | AcademicPeriod | Entity | Time-boxed period within a year (semester/term) |
| 7 | Branch | Entity | Academic discipline/department |
| 8 | Section | Entity | Subdivision of a branch; unit of mentor ownership |
| 9 | Group | Entity | Subdivision of a section; unit of TL ownership |
| 10 | Batch | Entity | Cohort that started in a given year; cuts across branches |

### Opportunity Management Context

| # | Entity | Type | Purpose |
|---|---|---|---|
| 11 | Opportunity | Aggregate Root | A publishable opportunity for participation |
| 12 | OpportunityTarget | Entity | Many-to-many: which branches/sections/groups/batches an opportunity targets |
| 13 | Participation | Aggregate Root | Tracks a student's journey through an opportunity |
| 14 | Submission | Entity | A student's submission (proof, description) for an opportunity |
| 15 | FileReference | Value Object | Pointer to a file in S3-compatible storage |
| 16 | VerificationLog | Entity | Immutable audit of verification actions |

### Notification Context

| # | Entity | Type | Purpose |
|---|---|---|---|
| 17 | Notification | Entity | In-app and email notification record |

### Analytics Context

| # | Entity | Type | Purpose |
|---|---|---|---|
| 18 | (Materialized Views) | View | Read-optimized aggregations — no write-side entities |

---

## 12. Entity Relationship Summary

```
User 1────N Enrollment 1────1 AcademicPeriod
User 1────N RoleAssignment
User 1────N Notification

AcademicYear 1────N AcademicPeriod

AcademicPeriod 1────N Branch 1────N Section 1────N Group
AcademicPeriod 1────N Batch

Branch 1────N Section
Section 1────N Group

AcademicPeriod 1────N Opportunity
Opportunity 1────N OpportunityTarget
  OpportunityTarget N────1 Branch (can target branches, sections, groups, batches)
  OpportunityTarget N────1 Section
  OpportunityTarget N────1 Group
  OpportunityTarget N────1 Batch

Opportunity 1────N Participation N────1 Enrollment
  Participation 1────N Submission
  Submission 1────N VerificationLog
  Submission N────1 FileReference (via JSON array; could be normalized)

User 1────N VerificationLog (as actor)
User 1────N Enrollment

Enrollment N────1 Batch
Enrollment N────1 Section (denormalized for efficient querying; Section also reachable via Group)
Enrollment N────1 Group? (nullable)
```

### Key Relationship Rules

1. **An Enrollment always belongs to exactly one AcademicPeriod.** This enables period-scoped queries.
2. **An Opportunity always belongs to exactly one AcademicPeriod.** This is the scoping mechanism for "future batches without redesign."
3. **A Participation bridges an Opportunity and an Enrollment** (which implies the student, batch, and period). This avoids redundant FKs.
4. **A Submission belongs to exactly one Participation.** Multiple submissions per Participation are allowed.
5. **A VerificationLog belongs to exactly one Submission.** Immutable chain of events.
6. **RoleAssignment has no FK to Enrollment.** A user can have a role without being enrolled (e.g., external mentor).
7. **Section has optional mentor_user_id** as a denormalized reference for quick lookup; the authoritative source is RoleAssignment with `role=mentor, scope_type=section`. The denormalization is an optimization for frequent queries ("who is my section mentor?").
8. **Group has optional team_leader_user_id** for the same reason. Authoritative source is RoleAssignment with `role=team_leader, scope_type=group`.

---

## 13. Final Architecture Decisions (ADRs)

### ADR-1: Modular Monolith over Microservices

**Decision:** Build as a modular monolith with clear bounded contexts, not distributed microservices.

**Rationale:** At 5,000 users, the operational overhead of microservices (service discovery, distributed transactions, network latency, deployment complexity) outweighs benefits. The module boundaries are designed such that extraction to services is possible if scale demands it.

**Consequence:** Teams must respect module boundaries (no cross-context foreign keys). Communication between contexts must go through domain events, not direct database access.

### ADR-2: Hybrid Authorization (Scoped RBAC + ABAC)

**Decision:** Use scoped RBAC for role assignment, ABAC for resource-level conditions.

**Rationale:** See §4.4. Flat RBAC cannot express scope (which section/section). Pure ABAC requires complex policy engines. Hybrid provides clarity at the role level and flexibility at the resource level.

**Consequence:** Authorization logic is centralized in a Policy Decision Point module. Every controller call goes through `authorize(user, action, resource)`.

### ADR-3: CQRS via Materialized Views

**Decision:** Use PostgreSQL materialized views for read models, refreshed via domain events.

**Rationale:** See §10.2. No additional operational infrastructure needed. Sufficient for the target scale. Swappable if scale exceeds 10,000+ concurrent writes.

**Consequence:** Analytics queries may return data up to 5 seconds stale (debounce window). This is acceptable for dashboard/analytics use cases.

### ADR-4: Period-Scoped Entities

**Decision:** All major entities (Opportunity, Enrollment, Section, Group under a period) are scoped to an AcademicPeriod.

**Rationale:** Enables rollover between batches/academic years without schema changes or data migration. A new period = new records. Historical data is preserved and queryable.

**Consequence:** Every query of business relevance must include an AcademicPeriod filter. The API layer should derive the current period from context (active academic year → active period) by default, but allow explicit override.

### ADR-5: Event Sourcing for Audit (Not for State)

**Decision:** Events are persisted in AuditLog for audit purposes only. Current state is stored in normalized tables (not derived from event replay).

**Rationale:** Full event sourcing (state derived from event stream) adds significant complexity (snapshotting, event versioning, projection management) without clear benefit at this scale. Audit events are append-only but the primary source of truth remains the current state in relational tables.

**Consequence:** AuditLog provides a complete history of who did what and when. If current state is corrupted, audit logs allow manual reconstruction but not automatic replay.

### ADR-6: Presigned URLs for File Access

**Decision:** Never expose internal S3 keys to clients. Generate presigned URLs for upload/download with expiration.

**Rationale:** Security (no leaked bucket keys), simplicity (no file proxy server needed), and flexibility (storage provider swappable).

**Consequence:** Upload flow: client requests presigned URL from API → client uploads directly to S3 → client submits form with returned file key. Download flow: API returns presigned URL with time-limited access for each request.

### ADR-7: Roll Number is an Identifier, Not Auth Principal

**Decision:** Authentication is by email/username + password. Roll number is stored on Enrollment as a display/legacy identifier, not used for login.

**Rationale:** Roll numbers are not unique across time (reused by different batches) and alumni/staff lack roll numbers entirely. Using roll number as auth principal creates identity conflicts and forces unnatural workarounds.

**Consequence:** Import workflows must handle the mapping of student data (name, roll number → create User + Enrollment). The import process creates User accounts with temporary passwords and sends activation emails.

---

## Appendix A: Flaw Resolution Traceability

| Original Flaw | Resolution |
|---|---|
| F1: Conflating identity with role | §3.1 — User (identity) separated from Enrollment (student relationship) separated from RoleAssignment (functional role) |
| F2: No explicit batch/semester entity | §5.2 — AcademicYear + AcademicPeriod + Batch entities added |
| F3: Flat RBAC without scope | §4 + ADR-2 — Scoped RoleAssignment replaces flat role table; hybrid ABAC/RBAC |
| F4: TL verification single point of failure | §7.2-7.3 — Escalation flow + auto-verification rules + mentor override |
| F5: No opportunity lifecycle | §6.1 — 5-state state machine (Draft → Published → Open → Closed → Archived) |
| F6: Analytics queries degrading writes | §10 + ADR-3 — Materialized views for reads; no analytics queries hit transactional tables |
| F7: No audit trail | §9 — AuditLog with domain events; immutable append-only |
| F8: Storage coupling | ADR-6 — FileReference + presigned URLs abstract storage provider |
| F9: Password auth with roll numbers | ADR-7 — Email/username login; roll number is a student identifier only |
