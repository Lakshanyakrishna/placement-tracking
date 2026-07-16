import { test, expect } from '@playwright/test';
import { authedContext, apiLogin, API_URL } from '../fixtures/auth';
import { STUDENT, MENTOR_AND_TL1, TEAM_LEADER_GROUP2 } from '../fixtures/seed-data';

test.describe('Student blocked from admin routes', () => {
  test('UI redirects away from /admin/dashboard', async ({ browser }) => {
    const { context, page } = await authedContext(browser, STUDENT.email, STUDENT.password);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await context.close();
  });

  test('backend rejects the admin-only API call with 403', async ({ request }) => {
    const { accessToken } = await apiLogin(request, STUDENT.email, STUDENT.password);
    const response = await request.get(`${API_URL}/dashboard/admin`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(403);
  });
});

test.describe('Mentor blocked from admin routes', () => {
  test('UI redirects away from /admin/dashboard', async ({ browser }) => {
    const { context, page } = await authedContext(browser, MENTOR_AND_TL1.email, MENTOR_AND_TL1.password);
    await page.goto('/admin/dashboard');
    // This account holds both mentor and team_leader roles (seed.ts assigns both to
    // the first student of Group 1) — RoleGuard picks whichever role comes first in
    // the roles array, so accept either of that account's own dashboards, just not admin's.
    await expect(page).toHaveURL(/\/(mentor|team-leader)\/dashboard$/);
    await context.close();
  });

  test('backend rejects the admin-only API call with 403', async ({ request }) => {
    const { accessToken } = await apiLogin(request, MENTOR_AND_TL1.email, MENTOR_AND_TL1.password);
    const response = await request.get(`${API_URL}/dashboard/admin`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(403);
  });
});

test.describe('Team leader blocked from admin routes', () => {
  test('UI redirects away from /admin/dashboard', async ({ browser }) => {
    const { context, page } = await authedContext(browser, TEAM_LEADER_GROUP2.email, TEAM_LEADER_GROUP2.password);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/team-leader\/dashboard$/);
    await context.close();
  });

  test('backend rejects the admin-only API call with 403', async ({ request }) => {
    const { accessToken } = await apiLogin(request, TEAM_LEADER_GROUP2.email, TEAM_LEADER_GROUP2.password);
    const response = await request.get(`${API_URL}/dashboard/admin`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(403);
  });

  test('UI redirects away from admin-only /admin/students and /admin/verifications', async ({ browser }) => {
    const { context, page } = await authedContext(browser, TEAM_LEADER_GROUP2.email, TEAM_LEADER_GROUP2.password);
    await page.goto('/admin/students');
    await expect(page).toHaveURL(/\/team-leader\/dashboard$/);

    await page.goto('/admin/verifications');
    await expect(page).toHaveURL(/\/team-leader\/dashboard$/);
    await context.close();
  });

  test('/admin/opportunities IS reachable — it allows admin, mentor, and team_leader', async ({ browser }) => {
    const { context, page } = await authedContext(browser, TEAM_LEADER_GROUP2.email, TEAM_LEADER_GROUP2.password);
    await page.goto('/admin/opportunities');
    await expect(page).toHaveURL(/\/admin\/opportunities$/);
    await expect(page.getByRole('heading', { name: 'Certifications' })).toBeVisible();
    await context.close();
  });
});
