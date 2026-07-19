# Placement Opportunity Tracking and Monitoring System

A role-based platform (Admin, Mentor, Team Leader, Student) for colleges to publish placement and certification opportunities, track student participation, collect proof submissions, and verify them — with dashboards and analytics tailored to each role.

## Tech Stack

- **Backend:** NestJS + TypeORM + PostgreSQL
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS, `react-hook-form` + `zod` for forms, `recharts` for dashboard charts, `framer-motion` for the landing page's interactive login modal (lazy-loaded — kept out of the eager bundle to protect the public landing page's Lighthouse score)
- **Auth:** JWT (short-lived access token + httpOnly refresh cookie)
- **Storage:** S3-compatible object storage (Cloudflare R2, AWS S3, MinIO for local dev)
- **Email:** SMTP (MailHog for local dev)
- **Local dev:** Docker Compose
- **Deployment:** Render + Neon + Cloudflare R2 (backend/DB/storage), Vercel (frontend) — see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md); Railway is also supported (`railway.json`)

## Features

- **Public landing page** — St. Mary's-branded marketing site (hero, placement stats, accreditations, role-by-role feature breakdown) with an interactive bridge-toggle login modal, rather than a separate `/login` route, so a first-time visitor only downloads the landing page itself
- **Role-based dashboards** — distinct views for Admin, Mentor, Team Leader, and Student. Mentor and Team Leader share a single dashboard hub (`/dashboard`) with a preview tile per role someone actually holds, rather than forcing a dual-role person through two unrelated full dashboards
- **Opportunity management** — create, publish, archive placement drives and certifications, targeted by branch, section, batch, or group; optional application link, a separate meeting/assessment link, and multi-round scheduling (e.g. Round 1: Online Assessment, Round 2: Technical Interview), each round with its own link and time
- **Participation tracking** — students start, progress through, and complete assigned opportunities; round links and schedules surface directly on their certification/placement cards
- **Proof submission & verification workflow** — students upload proof documents; team leaders/mentors verify or reject with notes; students can view/download their own submitted file back
- **Excel bulk imports** — students, mentors, groups, and team leaders can be imported in bulk from spreadsheets
- **Analytics & drill-down** — a color-coded Certification Completion Heatmap (with legend), a click-to-drill-down Group Performance chart (click a group's bar to see student-level status), and per-opportunity registration analytics (who registered, broken down by group/team leader)
- **Follow-up queue** — mentors get a section-scoped list of stalled (in-progress/submitted) participations, sorted by days pending
- **Email notifications** — for key workflow events, including a working forgot-password → reset-password flow
- **Forced password change** on first login for all seeded/imported accounts

## Local Development Quick Start

```bash
# 1. Copy environment configuration
cp infrastructure/.env.example .env

# 2. Start all services (Postgres, MinIO, MailHog, API)
docker compose -f infrastructure/docker-compose.yml up -d

# 3. Run database migrations
npm run migration:run

# 4. Seed fixture data (fake students/groups — see src/scripts/seed.ts)
npm run seed

# 5. Verify health
curl http://localhost:3000/api/v1/health

# 6. View logs
docker compose -f infrastructure/docker-compose.yml logs -f app
```

Frontend (run separately):

```bash
cd frontend
npm install
npm run dev
```

### Local dev services

| Service | Port | Credentials | Notes |
|---|---|---|---|
| NestJS API | 3000 | — | `/api/docs` for Swagger |
| PostgreSQL | 5432 | postgres / dev_password_only | local-dev only |
| MinIO API | 9000 | minioadmin / minioadmin | local-dev only, S3-compatible |
| MinIO Console | 9001 | minioadmin / minioadmin | local-dev only |
| MailHog SMTP | 1025 | — | local-dev only |
| MailHog UI | 8025 | — | local-dev only |

## Environment Variables

See [`.env.example`](.env.example) (and [`infrastructure/.env.example`](infrastructure/.env.example) for the Docker Compose variant) for the full list with comments. At minimum, production requires:

- `JWT_SECRET` — the app fails to boot without this in production
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` — the app fails to boot without `DB_PASSWORD` in production
- `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_BUCKET` — persistent proof-file storage
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` — transactional email

To bootstrap the first production admin account (instead of relying on seed data), set `ADMIN_EMAIL` and `ADMIN_PASSWORD` and run `npm run seed:admin`.

## Testing

Three layers — see [`docs/TESTING.md`](docs/TESTING.md) for the full breakdown:

- **Backend unit/integration:** `npm test` (Jest, `src/**/*.spec.ts`)
- **End-to-end (Playwright):** `npm run e2e` (headless), `npm run e2e:ui` (interactive debugging), `npm run e2e:report` (last HTML report) — lives in its own `e2e/` project
- **Post-deploy smoke test:** `scripts/smoke-test.sh` — run this after every deploy (see Deployment below)

CI (`.github/workflows/ci.yml`) runs all of the above except the smoke test (which needs a real deployed URL) on every push/PR to `main`.

## Deployment

For the concrete Render + Neon + Cloudflare R2 + Vercel walkthrough (including how to migrate real seeded data so logins survive the move), see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

- **Backend (Railway/Render):** builds from `infrastructure/docker/app/Dockerfile` via the `production` target. Railway config is in [`railway.json`](railway.json) (health check at `/api/v1/health`). Set all required environment variables above in the platform's dashboard — `NODE_ENV=production` (or `APP_ENV=production`) must be set for the fail-fast secret checks and secure cookie behavior to activate.
- **Frontend (Vercel):** config in [`frontend/vercel.json`](frontend/vercel.json). `VITE_API_BASE_URL` must be set to the deployed backend's full URL in the Vercel project's environment variables, since Vite bakes `VITE_*` variables in at build time and there's no dev-server proxy in production.
- **After every deploy**, run the smoke test against the real URLs to confirm the API, database, and auth are actually wired up:

  ```bash
  API_URL=https://your-backend.up.railway.app/api/v1 \
  FRONTEND_URL=https://your-frontend.vercel.app \
  ./scripts/smoke-test.sh
  ```

## Documentation

See [`docs/`](docs/) for architecture deep-dives:

| Document | Description |
|---|---|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, domain model, authorization |
| [`SCHEMA.md`](docs/SCHEMA.md) | PostgreSQL schema design |
| [`AUTH-DESIGN.md`](docs/AUTH-DESIGN.md) | Authentication & authorization flows |
| [`BACKEND-ARCHITECTURE.md`](docs/BACKEND-ARCHITECTURE.md) | NestJS module design |
| [`FRONTEND-ARCHITECTURE.md`](docs/FRONTEND-ARCHITECTURE.md) | React frontend architecture |
| [`INFRASTRUCTURE-DESIGN.md`](docs/INFRASTRUCTURE-DESIGN.md) | Docker infrastructure design |
| [`ONBOARDING-AND-LOGIN.md`](docs/ONBOARDING-AND-LOGIN.md) | Plain-language guide for the Placement Cell: how students/mentors/team leaders actually get their first login |
| [`TESTING.md`](docs/TESTING.md) | Full breakdown of the three test layers (unit/integration, e2e, smoke) |
| [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Concrete Render + Neon + Cloudflare R2 + Vercel deployment walkthrough |
