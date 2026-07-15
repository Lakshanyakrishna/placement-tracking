# Placement Opportunity Tracking and Monitoring System

A role-based platform (Admin, Mentor, Team Leader, Student) for colleges to publish placement and certification opportunities, track student participation, collect proof submissions, and verify them — with dashboards and analytics tailored to each role.

## Tech Stack

- **Backend:** NestJS + TypeORM + PostgreSQL
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Auth:** JWT (short-lived access token + httpOnly refresh cookie)
- **Storage:** S3-compatible object storage (Cloudflare R2, AWS S3, MinIO for local dev)
- **Email:** SMTP (MailHog for local dev)
- **Local dev:** Docker Compose
- **Deployment:** Railway or Render (backend), Vercel (frontend)

## Features

- **Role-based dashboards** — distinct views and permissions for Admin, Mentor, Team Leader, and Student
- **Opportunity management** — create, publish, archive placement drives and certifications, targeted by branch, section, batch, or group
- **Participation tracking** — students start, progress through, and complete assigned opportunities
- **Proof submission & verification workflow** — students upload proof documents; team leaders/mentors verify or reject with notes
- **Excel bulk imports** — students, mentors, groups, and team leaders can be imported in bulk from spreadsheets
- **Analytics** — certification/placement completion breakdowns by group, for mentors and admins
- **Email notifications** — for key workflow events
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

## Deployment

- **Backend (Railway/Render):** builds from `infrastructure/docker/app/Dockerfile` via the `production` target. Railway config is in [`railway.json`](railway.json) (health check at `/api/v1/health`). Set all required environment variables above in the platform's dashboard — `NODE_ENV=production` (or `APP_ENV=production`) must be set for the fail-fast secret checks and secure cookie behavior to activate.
- **Frontend (Vercel):** config in [`frontend/vercel.json`](frontend/vercel.json). `VITE_API_BASE_URL` must be set to the deployed backend's full URL in the Vercel project's environment variables, since Vite bakes `VITE_*` variables in at build time and there's no dev-server proxy in production.

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
