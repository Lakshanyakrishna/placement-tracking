#!/usr/bin/env bash
# Post-deploy smoke test. Run this after every Railway/Render (backend) or Vercel
# (frontend) deploy to confirm the new deployment is actually wired up correctly —
# no real credentials required.
#
# Usage:
#   API_URL=https://your-app.up.railway.app/api/v1 \
#   FRONTEND_URL=https://your-app.vercel.app \
#   ./scripts/smoke-test.sh
#
# Exits non-zero if any check fails.

set -u

if [[ -z "${API_URL:-}" || -z "${FRONTEND_URL:-}" ]]; then
  echo "Usage: API_URL=<backend base url, e.g. https://x.up.railway.app/api/v1> FRONTEND_URL=<frontend url> $0" >&2
  exit 1
fi

failures=0

check() {
  local description="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "OK   - $description (got $actual)"
  else
    echo "FAIL - $description (expected $expected, got $actual)" >&2
    failures=$((failures + 1))
  fi
}

echo "Smoke testing API_URL=$API_URL FRONTEND_URL=$FRONTEND_URL"
echo

# 1. Backend health endpoint responds.
health_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$API_URL/health")
check "health endpoint returns 200" "$health_status" "200"

# 2. Frontend root loads.
frontend_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -L "$FRONTEND_URL/")
check "frontend root returns 200" "$frontend_status" "200"

# 3. Login with an intentionally wrong password returns 401 — this proves the API
# is reachable, the database is connected, and the auth code path actually runs,
# all without needing any real account credentials in this script.
login_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
  -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke-test-nonexistent-user@example.com","password":"definitely-wrong-password"}')
check "login with wrong credentials returns 401 (API + DB + auth wired up)" "$login_status" "401"

echo
if [[ "$failures" -eq 0 ]]; then
  echo "All smoke checks passed."
  exit 0
else
  echo "$failures smoke check(s) failed." >&2
  exit 1
fi
