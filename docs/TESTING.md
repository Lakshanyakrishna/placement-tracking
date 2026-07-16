# Testing

This project is verified at three layers: backend unit/integration tests, an
end-to-end (E2E) UI suite, and a post-deploy smoke test.

## 1. Backend unit and integration tests

Location: `src/**/*.spec.ts`, run with Jest.

```bash
npm test              # everything (unit + integration)
npm run test:watch    # watch mode
npm run test:cov      # with coverage
```

There's no separate npm script to run only unit or only integration specs locally
— both live side by side and share the same Jest config (`package.json`'s `jest`
block, `testRegex: ".*\\.spec\\.ts$"`). CI splits them into two steps purely by
filename pattern (`*.integration.spec.ts` vs everything else) so a failure is
easier to categorize in the Actions log; locally, `npm test` runs both together.

Requires a running Postgres (see the root README's Quick Start) and migrations
applied (`npm run migration:run`).

## 2. End-to-end (E2E) suite

Location: `e2e/` — a separate npm project (own `package.json`), using
[Playwright](https://playwright.dev), Chromium only.

### Running locally

```bash
# from the repo root
npm run e2e          # headless run
npm run e2e:ui       # Playwright's interactive UI mode — best for debugging
npm run e2e:report   # opens the last HTML report
```

The first time, install Chromium once:

```bash
cd e2e && npx playwright install --with-deps chromium
```

`npm run e2e` expects Postgres to already be running (e.g. via
`docker compose -f infrastructure/docker-compose.yml up -d`). Playwright's
`webServer` config (`e2e/playwright.config.ts`) then starts the backend
(`npm run start:dev`) and frontend (`npm run dev`) for you if they aren't already
running, or reuses them if they are.

Before every run, `e2e/global-setup.ts` runs `npm run migration:run` and
`npm run seed` to reset the database to a known, fully fake state (see
`src/scripts/seed.ts` — no real student data), then logs in via the API as a
handful of fixture accounts and writes their sessions to `e2e/.auth/*.json` so
most spec files never have to click through the login form. See
`e2e/fixtures/seed-data.ts` for exactly which seeded account backs each role.

### What each spec file covers

| File | Covers |
|---|---|
| `smoke-public.spec.ts` | Landing page, health endpoint, 404 page |
| `auth.spec.ts` | Login (valid/invalid), forced password change, logout |
| `role-guards.spec.ts` | Student/mentor/team-leader blocked from admin routes, both in the UI and at the API (403) |
| `opportunity-lifecycle.spec.ts` | Admin creates/edits/publishes a global opportunity; a team leader creates a group-scoped certification; targeting rules are verified from students' point of view |
| `participation-submission.spec.ts` | A student starts a certification, uploads a proof file, sees it pending |
| `verification.spec.ts` | A team leader approves one submission and rejects another with a reason; the student sees the updated statuses and resubmits the rejected one |
| `dashboards.spec.ts` | Admin/student/team-leader/mentor dashboards render real data with no error/loading-stuck states |
| `imports.spec.ts` | Bulk student import via the API (valid file, row-level errors, missing-column error, non-admin 403) |

Two things called out during this suite's construction that don't match what
might be assumed from a feature list — see the `NOTE on scope` comment at the top
of `opportunity-lifecycle.spec.ts` and `verification.spec.ts` for the details:

- There's no admin-facing "set explicit targets" UI/API for opportunities — admin
  opportunities are always global by design; only mentors/team leaders can scope
  to their own group/section.
- There's no interactive admin/mentor verification queue — only the Team Leader
  dashboard has working Approve/Reject buttons. `imports.spec.ts` also has no
  frontend to click through at all; it tests the backend API directly.

### Adding a new E2E test

1. Add any new fixture accounts/constants to `e2e/fixtures/seed-data.ts` if the
   existing ones (admin, mentor+TL1, TL-of-group-2, two plain students) don't
   cover what you need. If a new account needs its password changed away from the
   forced-change state, add it to `WORKHORSE_ACCOUNTS` and give `global-setup.ts`
   a new `fs.writeFileSync` line and `STORAGE_STATE_PATHS` entry.
2. Reuse the helpers in `e2e/utils/flows.ts` (`createOpportunityDraft`,
   `publishOpportunity`, `startParticipation`, `beginWork`, `uploadProof`,
   `reuploadProof`) rather than re-deriving UI steps from scratch — they're the
   source of truth for how those flows actually work in the current UI.
3. Read the actual page component before writing selectors — this app has almost
   no `data-testid` attributes, so selectors lean on `getByRole`/`getByLabel`
   against real accessible names, or (where a component has no accessible name at
   all, e.g. the certification/placement Card grid) a structural CSS class
   (`.rounded-xl`) combined with `.filter({ hasText })`.
4. Use `uniqueName()`/`uniqueSuffix()` from `e2e/utils/unique.ts` for any entity
   your test creates, so re-running the suite (or running it alongside other
   tests against the same seeded DB) never collides on a duplicate title/email.
5. New tests should create whatever data they depend on themselves rather than
   assuming another spec file ran first — Playwright doesn't guarantee cross-file
   execution order, and the whole point of resetting via seed in global setup is
   that any single file should be runnable on its own.

## 3. Post-deploy smoke test

`scripts/smoke-test.sh` — a small bash+curl script, no test framework, meant to
run right after a real deploy (Railway/Render backend, Vercel frontend) using the
real deployed URLs. It doesn't need or use any real account credentials: it
proves the API, database, and auth code path are all wired up by checking that a
deliberately-wrong login attempt returns 401 rather than a connection error or 500.

```bash
API_URL=https://your-backend.up.railway.app/api/v1 \
FRONTEND_URL=https://your-frontend.vercel.app \
./scripts/smoke-test.sh
```

Exits non-zero if any check fails, so it's safe to wire into a deploy pipeline as
a gate.
