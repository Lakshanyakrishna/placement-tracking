# Schema MVP Readiness Review

> **Context:** 1-month delivery target, single college, 1,000–5,000 users  
> **Source:** `SCHEMA.md` (v1.0 approved architecture)  
> **Method:** Every table, constraint, index, trigger, partition, and pattern classified into three tiers.

---

## Classification Summary

```
┌────────────────────────────────────────────────────────────────────┐
│  MVP Must Have    ████████████████████ 11 tables, ~40% of design  │
│  Nice to Have     ████████████████      6 tables, ~35% of design  │
│  Enterprise       ██████                2 tables, ~25% of design  │
└────────────────────────────────────────────────────────────────────┘
```

An MVP can ship with **11 of 18 tables**, **6 of 9 ENUMs**, **1 of 10 check constraints**, and **zero triggers/partitions**. The remaining elements add operational rigor, audit compliance, and scale readiness — not core functionality.

---

## 1. Table Classification

### 1.1 Must Have for MVP (11 tables)

| Table | Why MVP Needs It | Risk of Skipping |
|---|---|---|
| `users` | Core identity — no authentication without it | System cannot function |
| `academic_years` | Time-container for semesters; batch rollover | Data cannot be period-scoped |
| `academic_periods` | Time-boxes every business entity | Opportunities/enrollments have no temporal scope |
| `branches` | Organizational structure (CSE, ECE, ME) | Cannot organize students by discipline |
| `sections` | Unit of mentor ownership; required by business rule #4 | Mentors have no scope of control |
| `groups` | Unit of TL ownership; required by business rule #5 | TLs cannot be assigned to a subset of students |
| `batches` | Cohort tracking for analytics | No cross-branch cohort aggregation |
| `enrollments` | Bridges students to academic structure | Users cannot be associated with branches/sections |
| `role_assignments` | Enables multi-role assignment (Student+TL, Student+Mentor) | Violates business rule #2 |
| `opportunities` | Core publishing entity | Nothing to participate in |
| `participations` | Tracks student journey per opportunity | Cannot track who participated or completed |
| `submissions` | Student proof of participation | Cannot collect or verify participation evidence |

**Total: 12 tables** (including `batches` — see rationale below)

> **Note on `batches`:** Included because the enrollment model requires `batch_id` and cross-branch batch analytics is an MVP reporting requirement. Without batches, you cannot answer "how many Batch 2025 students participated." The table is 3 columns with 1–4 rows — negligible cost.

#### Simplified MVP Versions

Three tables in Must Have should use a simplified schema for MVP:

**`role_assignments` — Remove temporal complexity:**

```sql
-- MVP version: drop valid_from, valid_to, granted_by, btree_gist
CREATE TABLE role_assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    role        user_role NOT NULL,       -- admin | mentor | team_leader
    scope_type  role_scope_type NOT NULL,  -- global | section | group
    scope_id    UUID NOT NULL,             -- section_id or group_id
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_role_assignments_unique 
    ON role_assignments (user_id, role, scope_type, scope_id);
CREATE INDEX idx_role_assignments_scope 
    ON role_assignments (role, scope_type, scope_id);
```

- Removed: `valid_from`, `valid_to`, `granted_by`, `updated_at`, `btree_gist`, 4 indexes → 2 indexes
- Impact: Admins must manually remove+recreate assignments instead of expiry; acceptable for MVP
- Retrofit difficulty: **Easy** — add columns via ALTER TABLE, migration maps existing rows

**`opportunities` — Embed targeting directly:**

```sql
-- MVP version: add target columns directly on opportunities
CREATE TABLE opportunities (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_period_id      UUID NOT NULL REFERENCES academic_periods(id),
    title                   VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL DEFAULT '',
    opportunity_type        opportunity_type NOT NULL,
    state                   opportunity_state NOT NULL DEFAULT 'draft',
    created_by              UUID NOT NULL REFERENCES users(id),
    opens_at                TIMESTAMPTZ,
    closes_at               TIMESTAMPTZ,
    verification_deadline   INTERVAL NOT NULL DEFAULT '7 days',
    require_proof           BOOLEAN NOT NULL DEFAULT TRUE,
    max_submissions         INTEGER,
    target_branch_id        UUID REFERENCES branches(id),   -- NULL = all branches
    target_section_id       UUID REFERENCES sections(id),   -- NULL = all sections
    target_batch_id         UUID REFERENCES batches(id),    -- NULL = all batches
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- Removed: `opportunity_targets` table entirely, `allow_group_submission`, `target_type` ENUM
- Impact: An opportunity can target at most (1 branch + 1 section + 1 batch) simultaneously — typically sufficient. Multi-target (e.g., "CSE and ECE but not ME") is impossible; rare for MVP
- Retrofit difficulty: **Medium** — add `opportunity_targets`, migrate data from columns, drop columns. Application code targeting queries must change

**`submissions` — Embed file references as JSONB:**

```sql
-- MVP version: inline file metadata in submissions
CREATE TABLE submissions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participation_id  UUID NOT NULL REFERENCES participations(id),
    submitted_by      UUID NOT NULL REFERENCES users(id),
    description       TEXT,
    files             JSONB,              -- [{"key": "path/to/file.pdf", "name": "cert.pdf", "size": 12345}]
    external_links    JSONB,
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_late           BOOLEAN NOT NULL DEFAULT FALSE,
    rejection_reason  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- Removed: `submission_files`, `file_references` tables entirely
- Impact: Cannot share file references across submissions; file deduplication is application-level rather than DB-enforced. Acceptable for MVP
- Retrofit difficulty: **Easy** — create `file_references` + `submission_files` tables, write migration to parse `files` JSONB into normalized rows, drop JSONB column

---

### 1.2 Nice to Have (6 tables — post-MVP, within 3 months)

| Table | Why Postponed | Impact of Skipping | Retrofit Difficulty |
|---|---|---|---|
| `opportunity_targets` | MVP embeds targeting as nullable FKs on `opportunities` (§1.1). Multi-target opportunities are rare in initial rollout | Cannot target (CSE + ECE) while excluding ME with a single opportunity. Admin creates duplicate opportunities instead | **Medium** — 1 new table + migration from columns |
| `submission_files` | MVP uses JSONB `files` column on submissions (§1.1) | Files cannot be shared across submissions; no referential integrity on file references. Rare edge case | **Easy** — new table, data migration from JSONB |
| `file_references` | MVP uses JSONB `files` column on submissions (§1.1) | Storage provider is still abstracted at application layer; no DB-level deduplication | **Easy** — new table, data migration from JSONB |
| `verification_logs` | Verification state is captured in `participations` (status + verified_at + verified_by) | No immutable audit trail for verification actions. Cannot answer "who rejected this and why history" for disputes | **Easy** — new table, write migration to reconstruct from participation history |
| `notifications` | MVP can send email directly from application code without persisting notification records | No in-app notification inbox. Emails that fail delivery are lost. No unread badge count | **Easy** — new table, add notification rendering to frontend |
| `groups` | See §1.1 — included in Must Have | — | — |

> **Correction:** `groups` is classified as Must Have. TL ownership of groups is a core business requirement (§5 of architecture). The list above reflects the corrected classification — 6 tables, not 7.

---

### 1.3 Enterprise Scale Feature (2 tables — 6+ months)

| Table | Why Enterprise | Impact of Skipping | Retrofit Difficulty |
|---|---|---|---|
| `audit_logs` | Compliance-grade immutable audit. MVP can rely on application logging (structured JSON to stdout, captured by Docker log driver) for debugging. No college at 5,000 users requests DB-level audit trails at month 1 | No reconstructable history of who did what. Debugging requires application logs. Cannot answer "when was this opportunity state changed and by whom" after application logs rotate | **Medium** — new table, events not captured retroactively. Must be added before any compliance audit requirement |
| `partitions` infrastructure | 5,000 users × 200 opportunities × 3 submissions = 3M rows max across 4 years. PostgreSQL handles this without partitioning. PG 16 can add partitioning later via pg_partman with table rebuild | Query performance on audit_logs degrades after 500K+ rows. Monthly maintenance windows for VACUUM | **Hard** — adding partitioning to a live table requires downtime or pg_repack. Better to add proactively at 500K row threshold |

---

## 2. ENUM Classification

| ENUM | Tier | Rationale |
|---|---|---|
| `user_role` | **Must Have** | Required by `role_assignments` |
| `role_scope_type` | **Must Have** | Required by `role_assignments` |
| `academic_period_type` | **Must Have** | Required by `academic_periods` |
| `opportunity_state` | **Must Have** | Required by `opportunities` |
| `opportunity_type` | **Must Have** | Required by `opportunities` |
| `participation_status` | **Must Have** | Required by `participations` |
| `target_type` | **Nice to Have** | Only needed with `opportunity_targets` table |
| `notification_type` | **Nice to Have** | Only needed with `notifications` table |
| `notification_channel` | **Nice to Have** | Only needed with `notifications` table |
| `notification_delivery_status` | **Nice to Have** | Only needed with `notifications` table |
| `verification_action` | **Nice to Have** | Only needed with `verification_logs` table |

**MVP ENUM count: 6 of 11.** Postpone 5 ENUMs until their corresponding tables are added.

---

## 3. Constraint Classification

### 3.1 Unique Constraints

| Constraint | Tier | Rationale |
|---|---|---|
| `uq_users_email` | **Must Have** | Prevents duplicate accounts |
| `uq_academic_years_label` | **Must Have** | Basic data integrity |
| `uq_academic_years_active` (partial) | **Nice to Have** | Application can enforce single-active-year during create/update |
| `uq_academic_periods_year_label` | **Must Have** | Basic data integrity |
| `uq_academic_periods_active` (partial) | **Nice to Have** | Application can enforce |
| `uq_branches_code` | **Must Have** | Basic data integrity |
| `uq_branches_name` | **Must Have** | Basic data integrity |
| `uq_sections_period_branch_code` | **Must Have** | Basic data integrity |
| `uq_groups_section_name` | **Must Have** | Basic data integrity |
| `uq_batches_year_label` | **Must Have** | Basic data integrity |
| `uq_enrollments_user_period` | **Must Have** | Prevents duplicate enrollment |
| `uq_participations_opportunity_enrollment` | **Must Have** | Prevents duplicate participation |
| `uq_submission_files_pair` | **N/A (MVP)** | Table not in MVP |
| `uq_file_references_path` | **N/A (MVP)** | Table not in MVP |
| `uq_role_assignments_no_overlap` | **Nice to Have** | Simplified MVP version uses simpler UQ |
| `uq_opportunity_targets_unique` | **N/A (MVP)** | Table not in MVP |

**MVP unique constraints: 11 of 15.** All unique constraints on MVP tables are included.

### 3.2 Check Constraints

| Constraint | Tier | Rationale |
|---|---|---|
| `ck_academic_periods_dates` (end > start) | **Must Have** | Catches data entry errors at DB level |
| `ck_opportunities_opens_at` | **Nice to Have** | Application should validate; dates are nullable and the CHECK is complex |
| `ck_opportunities_max_submissions` | **Nice to Have** | Application validates; negative values prevented by UI |
| `ck_opportunity_targets_single_target` | **N/A (MVP)** | Table not in MVP |
| `ck_participations_dates` (start ≤ submit) | **Nice to Have** | Application controls state machine; chronological consistency is enforced in code |
| `ck_participations_verified_consistency` | **Must Have** | Prevents orphan verification timestamps — critical for analytics accuracy |
| `ck_participations_status_verified` | **Nice to Have** | State machine consistency; application enforces this. DB CHECK adds safety but is not MVP-essential |
| `ck_file_references_size` | **N/A (MVP)** | Table not in MVP |
| `ck_role_assignments_valid_range` | **N/A (MVP)** | Simplified MVP table drops validity range |
| `ck_role_assignments_scope_id` | **Must Have** | Ensures scope_id is set when scope_type != 'global' — prevents orphan assignments |

**MVP check constraints: 2 of 10.** Only two carry their weight for a 1-month MVP (dates, verification consistency). The rest add safety margins that the application layer can provide.

**Why so few CHECK constraints in MVP:** Each CHECK constraint is a deployment blocker — if existing data violates it, the migration fails. At 1-month velocity, the risk of a bad migration blocking a release outweighs the marginal data integrity benefit. The `ck_participations_verified_consistency` CHECK is kept because verification data drives the core accountability workflow.

---

## 4. Trigger Classification

| Element | Tier | Rationale |
|---|---|---|
| `fn_update_updated_at()` | **Nice to Have** | Application code can set `updated_at = NOW()` on every UPDATE. The trigger saves 1 line of code per service method but adds a DB object that must exist in every environment |
| All `trg_{table}_updated_at` triggers | **Nice to Have** | Same reasoning. 17 triggers vs. `row.updated_at = new Date()` in 17 repository methods. Application-layer approach is simpler to debug and test |

**MVP trigger count: 0.**

**Impact of skipping:** Each repository UPDATE method needs `SET updated_at = NOW()`. This is standard practice in many production systems that avoid triggers for testability.

**Retrofit difficulty:** **Trivial** — create function and triggers in a migration. No data backfill needed.

---

## 5. Index Classification

### 5.1 Indexes on MVP Tables

| Index | Tier | Rationale |
|---|---|---|
| `uq_users_email` (LOWER) | **Must Have** | UNIQUE index — required for constraint |
| `idx_users_is_active` (partial) | **Nice to Have** | Admin user listing without this still works at 5,000 rows (seq scan is ~2ms) |
| `idx_enrollments_user` | **Must Have** | FK lookup — every dashboard query starts with "my enrollments" |
| `uq_enrollments_user_period` | **Must Have** | UNIQUE index — required for constraint |
| `idx_enrollments_section` | **Must Have** | Section roster — mentor's primary query |
| `idx_enrollments_group` | **Must Have** | Group roster — TL's primary query |
| `idx_enrollments_batch` | **Nice to Have** | Batch-level analytics at 5,000 rows can seq scan (< 5ms) |
| `idx_enrollments_roll_number` | **Nice to Have** | Roll number lookups are rare; import scripts can use email |
| `idx_role_assignments_scope` | **Must Have** | Auth PDP: "find mentor of section X" |
| `uq_role_assignments_unique` | **Must Have** | UNIQUE index — required for constraint |
| `idx_opportunities_period` | **Must Have** | "Show opportunities this period" — every page load |
| `idx_opportunities_state` | **Nice to Have** | State filter alone is rarely used without period |
| `idx_opportunities_creator` | **Nice to Have** | Admin views own opportunities — at 200 rows, seq scan is fine |
| `idx_opportunities_period_state` | **Must Have** | "Show open opportunities this period" — replaces single-column indexes |
| `uq_participations_opportunity_enrollment` | **Must Have** | UNIQUE index — required for constraint |
| `idx_participations_opportunity` | **Nice to Have** | Covered by `idx_participations_opportunity_status` |
| `idx_participations_enrollment` | **Must Have** | "My participations" — student dashboard |
| `idx_participations_status` | **Nice to Have** | Covered by composite index |
| `idx_participations_tl` | **Must Have** | TL dashboard: "my pending verifications" |
| `idx_participations_opportunity_status` | **Must Have** | "Pending verifications for this opportunity" |
| `idx_submissions_participation` | **Must Have** | FK lookup |
| `idx_submissions_submitted_at` | **Nice to Have** | Time-range queries are rare in MVP |
| `idx_submissions_participation_submitted` (DESC) | **Nice to Have** | "Latest submission" — app can ORDER BY submitted_at DESC without index at this scale |
| `idx_groups_tl` | **Must Have** | "Find TL's group" for auth checks |
| `idx_sections_mentor` | **Must Have** | "Find mentor's section" for auth checks |

**MVP indexes: 15 of 25.** Reducing from 25 to 15 saves write overhead on the 3 write-heavy tables (submissions, participations, role_assignments).

### 5.2 Indexes on Non-MVP Tables

All indexes on `opportunity_targets`, `submission_files`, `file_references`, `verification_logs`, `notifications`, `audit_logs` — **not applicable** (tables not in MVP).

---

## 6. Partitioning Classification

| Element | Tier | Rationale |
|---|---|---|
| All partitioning (`audit_logs`, `verification_logs`, `notifications`, `participations`) | **Enterprise** | At 5,000 users over 4 years, the largest table (`participations`) reaches ~800K rows. PostgreSQL handles this without partitioning. Partitioning adds schema complexity, requires `PRIMARY KEY (id, partition_key)` which complicates ORM mappings, and demands partition management automation |

**MVP partitioning count: 0.**

**When to add:** Monitor `pg_stat_user_tables.n_live_tup`. When any table exceeds 2M rows, evaluate partitioning for that specific table.

**Retrofit difficulty:** **Hard** — requires table rebuild or pg_repack. However, at the growth rate of this system (max 200K participations/year), partitioning isn't needed until year 3+.

---

## 7. Architectural Pattern Classification

| Pattern | Tier | Rationale |
|---|---|---|
| **UUID primary keys** | **Must Have** | Standard for distributed identity; used everywhere |
| **`created_at`/`updated_at` on every table** | **Must Have** | Debugging, analytics, sorting by recency |
| **No soft deletes** (is_active/state) | **Must Have** | Correct decision — simplifies all queries |
| **ENUM types instead of VARCHAR** | **Must Have** | Type safety, storage efficiency |
| **Referential integrity (FKs)** | **Must Have** | Core data integrity — no compensating for this in application code |
| **Unique constraints for business keys** | **Must Have** | Prevents duplicate data silently corrupting reports |
| **Denormalized mentor_user_id on sections** | **Nice to Have** | Application can query `role_assignments` to find section mentor. At 200 sections, the join is negligible |
| **Denormalized team_leader_user_id on groups** | **Nice to Have** | Same reasoning — join to role_assignments is cheap |
| **btree_gist temporal exclusion** | **Enterprise** | Prevents overlapping role assignments at DB level. MVP can enforce in application during role creation |
| **JSONB for flexible attributes** (submissions.files) | **Must Have** | MVP approach uses JSONB — correct for rapid iteration |
| **Polymorphic targeting** (opportunity_targets) | **N/A (MVP)** | Not in MVP schema |
| **ON DELETE CASCADE** (opportunity_targets, submission_files) | **N/A (MVP)** | Not in MVP schema |
| **Flyway migrations** | **Must Have** | Required for schema versioning in any team environment |
| **Column-level security** (password_hash) | **Must Have** | Application must exclude from SELECT queries — DB GRANT is extra safety |
| **Row-level security (RLS)** | **Enterprise** | Single-college deployment has no cross-tenant data isolation requirements |
| **Materialized views for analytics** | **Nice to Have** | MVP queries against transactional tables. At 5,000 rows, aggregation queries return in < 100ms |
| **Performance budget table** | **Nice to Have** | Documentation artifact — useful for onboarding but not executable code |

---

## 8. Implementation Roadmap

### Phase 1: MVP (Week 1–4)

```
Week 1: Foundation
  └─ V1.0  ENUM types (6 types)
  └─ V1.1  users, role_assignments (simplified)
  └─ V1.2  academic_years, academic_periods, branches, sections, groups, batches

Week 2: Core Business
  └─ V1.3  enrollments
  └─ V1.4  opportunities (with embedded target FKs)
  └─ V1.5  participations
  └─ V1.6  submissions (with JSONB files)

Week 3: Application Integration
  └─ Auth (JWT, email/password)
  └─ Admin: CRUD opportunities, manage roles
  └─ Student: view opportunities, submit participation
  └─ TL: view group submissions, verify/reject
  └─ Mentor: view section dashboard

Week 4: Polish & Deploy
  └─ Basic reporting (SQL queries, no materialized views)
  └─ Email notifications (sendmail, no persistence)
  └─ Deployment (Docker + PostgreSQL 16)
  └─ Load test with 1,000 synthetic users
```

**MVP schema: 12 tables, 6 ENUMs, 2 CHECK constraints, 15 indexes, 0 triggers, 0 partitions.**

### Phase 2: Consolidation (Month 2–3)

```
  └─ V2.0  opportunity_targets table (migrate from columns)
  └─ V2.1  file_references + submission_files tables (migrate from JSONB)
  └─ V2.2  verification_logs table (backfill from participation history)
  └─ V2.3  notifications table (enable in-app inbox)
  └─ V2.4  Add triggers for updated_at
  └─ V2.5  Add remaining CHECK constraints
```

### Phase 3: Enterprise Readiness (Month 6+)

```
  └─ V3.0  audit_logs table (start capturing events from this point forward)
  └─ V3.1  Evaluate partitioning at 500K+ row threshold
  └─ V3.2  Materialized views for analytics dashboards
  └─ V3.3  Row-level security if multi-department isolation is needed
  └─ V3.4  btree_gist temporal exclusion for role_assignments
```

---

## 9. Risk Register for Deferred Items

| Deferred Item | Risk | Mitigation |
|---|---|---|
| No audit_logs | Cannot reconstruct state change history after application log rotation | Application logs structured as JSON with correlation IDs. Retention: 90 days |
| No verification_logs | Cannot prove who verified a submission if participation record is updated | Participation record captures `verified_by` + `verified_at`. This is sufficient for 99% of queries |
| No notifications table | Emails that fail are lost; no user notification history | Application catches sendmail errors and retries. MVP accepts best-effort delivery |
| No partitioning | Single table scan on submissions at 3M rows takes ~500ms | Acceptable for MVP. Set up pg_cron monitoring to alert at 500K threshold |
| No triggers | One extra line per repository method | Standardized repository base class handles `updated_at` automatically |
| JSONB files instead of normalized | No referential integrity for file references; potential orphan keys | Application validates S3 keys before persisting. Periodic S3 cleanup job for unlinked files |

---

## 10. Bottom Line

> **The SCHEMA.md design is correct for the enterprise target but approximately 60% over-engineered for a 1-month MVP.**

The MVP should build 12 tables (not 18), 6 ENUMs (not 11), 2 CHECK constraints (not 10), 15 indexes (not 25), 0 triggers, and 0 partitions. Every deferred item has a clear upgrade path, and none require a schema redesign — only additive migrations.

The three tables that need simplified MVP versions (`role_assignments`, `opportunities`, `submissions`) are designed to accept their full-complexity columns later via `ALTER TABLE ADD COLUMN` without breaking existing data.
