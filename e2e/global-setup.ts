import { request as pwRequest } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import { apiLogin, apiChangePassword } from './fixtures/auth';
import { WORKHORSE_ACCOUNTS } from './fixtures/seed-data';

const repoRoot = path.resolve(__dirname, '..');

async function completeForcedPasswordChange(account: (typeof WORKHORSE_ACCOUNTS)[number]): Promise<void> {
  const context = await pwRequest.newContext();
  try {
    const { accessToken } = await apiLogin(context, account.email, account.seedPassword);
    // Completes the forced password change server-side so RoleGuard won't bounce
    // this account back to the change-password gate during ordinary tests. Each
    // spec file logs in fresh via fixtures/auth.ts's authedContext() as needed —
    // see that file's doc comment for why we don't persist a session here (refresh
    // tokens are single-use, so a saved snapshot would only work for one context).
    await apiChangePassword(context, accessToken, account.seedPassword, account.password);
  } finally {
    await context.dispose();
  }
}

export default async function globalSetup(): Promise<void> {
  // Reset to a known-clean, fully re-runnable state before every suite run. CI
  // already runs migrate+seed as its own pipeline step before the app starts, so it
  // sets SKIP_GLOBAL_SETUP_SEED=true to avoid redundantly wiping/reseeding the DB
  // a second time here; local `npm run e2e` always reseeds for a clean slate.
  if (process.env.SKIP_GLOBAL_SETUP_SEED !== 'true') {
    execSync('npm run migration:run', { cwd: repoRoot, stdio: 'inherit' });
    execSync('npm run seed', { cwd: repoRoot, stdio: 'inherit' });
  }

  await Promise.all(WORKHORSE_ACCOUNTS.map(completeForcedPasswordChange));

  // FRESH_STUDENT / FRESH_STUDENT_2 are deliberately left untouched (still
  // mustChangePassword: true) for auth.spec.ts's forced-password-change test.
  // ADMIN needs no setup — seeded with mustChangePassword: false already.
}
