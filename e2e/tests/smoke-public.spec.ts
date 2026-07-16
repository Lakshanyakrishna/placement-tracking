import { test, expect } from '@playwright/test';
import { LOGGED_OUT_STATE, API_URL } from '../fixtures/auth';

test.use({ storageState: LOGGED_OUT_STATE });

test.describe('Public smoke checks', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every Certification');
    // There are multiple elements navigating to /login on this page (desktop/mobile
    // nav + two hero CTAs) — just confirm at least one is present and works.
    await page.getByRole('button', { name: 'Login' }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.checks.database.status).toBe('ok');
  });

  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Dashboard' })).toBeVisible();
  });
});
