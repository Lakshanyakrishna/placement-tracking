# Placement Opportunity Tracking and Monitoring System

## Quick Start

```bash
# 1. Copy environment configuration
cp infrastructure/.env.example .env

# 2. Start all services
docker compose -f infrastructure/docker-compose.yml up -d

# 3. Verify health
curl http://localhost:3000/api/v1/health

# 4. View logs
docker compose -f infrastructure/docker-compose.yml logs -f app
```

## Architecture

- **Backend:** NestJS, TypeScript, TypeORM
- **Database:** PostgreSQL 16
- **Storage:** MinIO (S3-compatible)
- **Email:** MailHog (development)
- **Auth:** JWT (access + refresh tokens)
- **Infrastructure:** Docker, Docker Compose

## Services

| Service | Port | Credentials |
|---|---|---|
| NestJS API | 3000 | — |
| PostgreSQL | 5432 | postgres / dev_password_only |
| MinIO API | 9000 | minioadmin / minioadmin |
| MinIO Console | 9001 | minioadmin / minioadmin |
| MailHog SMTP | 1025 | — |
| MailHog UI | 8025 | — |

## Development Commands

See `BACKEND-ARCHITECTURE.md` and `INFRASTRUCTURE-DESIGN.md` for full documentation.

## Design Documents

| Document | Description |
|---|---|
| `ARCHITECTURE.md` | System architecture, domain model, authorization |
| `SCHEMA.md` | PostgreSQL schema design |
| `AUTH-DESIGN.md` | Authentication & authorization flows |
| `BACKEND-ARCHITECTURE.md` | NestJS module design |
| `INFRASTRUCTURE-DESIGN.md` | Docker infrastructure design |
| `MVP-REVIEW.md` | MVP scope analysis |
