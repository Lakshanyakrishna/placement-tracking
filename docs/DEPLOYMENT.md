# Deployment Guide — Render + Neon + Cloudflare R2 + Vercel

This is the concrete, step-by-step path for this project's chosen stack:

- **Database:** [Neon](https://neon.tech) — free Postgres that doesn't expire or get paused-and-deleted (unlike Render's own free Postgres, which is wiped after 90 days).
- **Backend:** [Render](https://render.com) — free web service, builds from the existing `infrastructure/docker/app/Dockerfile`.
- **File storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/) — S3-compatible, needed because Render's own filesystem is ephemeral (wiped on every redeploy/restart). Without this, every uploaded certificate/proof file would vanish on the next deploy.
- **Frontend:** [Vercel](https://vercel.com) — config already committed at `frontend/vercel.json`.

Each step below says who does it: **(you)** means it needs your own account/login (I can't do it for you), **(me)** means I can run it once you've completed the one-time CLI login for that tool.

---

## 1. Neon — Postgres

1. **(you)** Create a free account at neon.tech, create a new project (e.g. `placement-tracker-prod`). Note the connection string it gives you — it looks like:
   `postgresql://<user>:<password>@<host>/<db>?sslmode=require`
2. **(me, once you share the connection string, or via `neonctl` after `neonctl auth`)** Run migrations against it:
   ```bash
   DB_HOST=<neon-host> DB_PORT=5432 DB_USERNAME=<neon-user> DB_PASSWORD=<neon-pass> \
     DB_DATABASE=<neon-db> DB_SSL=true npm run migration:run
   ```
3. **(me)** Copy your real local data into it, so the same admin/mentor/team-leader/student logins keep working after deploy (this is the part that's easy to forget — a fresh production database starts completely empty):
   ```bash
   pg_dump -h localhost -p 5432 -U postgres -d placement_tracker --data-only --disable-triggers \
     | psql "postgresql://<neon-user>:<neon-pass>@<neon-host>/<neon-db>?sslmode=require"
   ```
4. **(me)** Verify row counts match (e.g. `SELECT count(*) FROM users;` should be the same on both sides).

## 2. Cloudflare R2 — file storage

1. **(you)** Create a free Cloudflare account, go to R2, create a bucket (e.g. `placement-proofs`).
2. **(you)** Create an R2 API token (R2 → Manage API Tokens) with read/write access to that bucket. Note the Access Key ID, Secret Access Key, and the account-specific S3 endpoint (`https://<account-id>.r2.cloudflarestorage.com`).
3. These become the `STORAGE_*` env vars in step 4 below.

## 3. Render — backend

1. **(you, dashboard-only step)** Create a free Render account, connect your GitHub account, and create a new **Web Service** from this repo.
   - Runtime: **Docker**
   - Dockerfile path: `infrastructure/docker/app/Dockerfile`
   - Docker build target: `production` (matches `railway.json`'s config, adapted for Render)
   - Health check path: `/api/v1/health`
2. **(you, in the Render dashboard's Environment tab)** Set these env vars (see `infrastructure/.env.example` for the full reference list with comments):

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_HOST` | your Neon host |
   | `DB_PORT` | `5432` |
   | `DB_USERNAME` | your Neon user |
   | `DB_PASSWORD` | your Neon password |
   | `DB_DATABASE` | your Neon db name |
   | `DB_SSL` | `true` |
   | `JWT_SECRET` | **generate a fresh one** — `openssl rand -hex 32`. Don't reuse your local `.env` value; a production secret should never have existed anywhere else. |
   | `JWT_ACCESS_EXPIRY` | `15m` |
   | `JWT_REFRESH_EXPIRY` | `7d` |
   | `JWT_ISSUER` | `placement-tracker` |
   | `STORAGE_ENDPOINT` | your R2 endpoint |
   | `STORAGE_REGION` | `auto` |
   | `STORAGE_ACCESS_KEY_ID` | your R2 access key |
   | `STORAGE_SECRET_ACCESS_KEY` | your R2 secret key |
   | `STORAGE_BUCKET` | `placement-proofs` |
   | `STORAGE_USE_SSL` | `true` |
   | `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM` | your real SMTP provider (e.g. Resend, SendGrid, or your institution's SMTP) — needed for password-reset emails to actually send |
   | `APP_CORS_ORIGIN` | your Vercel frontend URL, once you have it (step 4) |
   | `APP_BASE_URL` | this Render service's own URL (used to build the password-reset email link) |
   | `APP_ENV` | `production` |

3. **(you)** Deploy. The container's entrypoint (`infrastructure/docker/app/entrypoint.prod.sh`) automatically runs `npm run migration:run` on every boot — safe to leave as-is, it's idempotent.
4. **(me, once deployed)** Verify: `curl https://<your-render-url>/api/v1/health`.

## 4. Vercel — frontend

1. **(you or me via `vercel` CLI after `vercel login`)** Import this repo into Vercel, with the project root set to `frontend/`.
2. Set the environment variable `VITE_API_BASE_URL` to `https://<your-render-url>/api/v1` — this must be set **before** the first build, since Vite bakes `VITE_*` variables in at build time (there's no dev-server proxy in production).
3. Deploy. `frontend/vercel.json` already has the SPA rewrite rule configured.
4. Go back to Render and update `APP_CORS_ORIGIN` to this Vercel URL, then redeploy the backend so CORS allows it.

## 5. Post-deploy smoke test

Run the existing smoke test script against the real URLs:

```bash
API_URL=https://<your-render-url>/api/v1 \
FRONTEND_URL=https://<your-vercel-url> \
./scripts/smoke-test.sh
```

Then manually log in as a real seeded account (e.g. the admin) to confirm the migrated data and file storage both work end-to-end — upload a test certificate and confirm it downloads correctly (this exercises Neon + R2 + Render together in one action).

## Notes

- **Render's free tier spins down after 15 minutes of inactivity** — the first request after that takes ~30s to wake up. Fine for a demo; if the TPO complains about a slow first load, that's why.
- **Don't reuse your local `.env`'s `JWT_SECRET` or any local password in production.** Generate fresh secrets for everything at deploy time.
- **`npm run seed` should never be run against the production database.** It's for local/CI fixture data only — running it against Neon would overwrite or duplicate the real migrated student data from step 1.3.
