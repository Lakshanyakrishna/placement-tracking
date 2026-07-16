import { test, expect } from '@playwright/test';
import { LOGGED_OUT_STATE, authedContext } from '../fixtures/auth';
import { STUDENT, FRESH_STUDENT, E2E_PASSWORD } from '../fixtures/seed-data';

test.describe('Login and forced password change (starts logged out)', () => {
  test.use({ storageState: LOGGED_OUT_STATE });

  test('valid login lands on the correct role dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(STUDENT.email);
    await page.getByLabel('Password').fill(STUDENT.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await expect(page.getByRole('heading', { name: STUDENT.name })).toBeVisible();
  });

  test('invalid login shows an error and stays on the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(STUDENT.email);
    await page.getByLabel('Password').fill('definitely-the-wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.locator('p.text-red-600')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a must_change_password user is forced through the change-password flow and cannot navigate away until done', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(FRESH_STUDENT.email);
    await page.getByLabel('Password').fill(FRESH_STUDENT.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Change-password gate appears in place of the login form — no route change.
    // The card's title text is rendered via shadcn's CardTitle (a styled <div>, not
    // a semantic heading, so getByRole('heading', ...) would never match it) and the
    // submit button's own label is also literally "Change Password" — .first() picks
    // the title, which renders before the button in DOM order.
    await expect(page.getByText('Change Password', { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    // Attempting to skip ahead via direct URL navigation must not work: RoleGuard
    // detects mustChangePassword is still true and bounces back to /login, which
    // re-renders the same gate.
    await page.goto('/student/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    // The card's title text is rendered via shadcn's CardTitle (a styled <div>, not
    // a semantic heading, so getByRole('heading', ...) would never match it) and the
    // submit button's own label is also literally "Change Password" — .first() picks
    // the title, which renders before the button in DOM order.
    await expect(page.getByText('Change Password', { exact: true }).first()).toBeVisible();

    await page.getByLabel('Current Password').fill(FRESH_STUDENT.password);
    await page.getByLabel('New Password', { exact: true }).fill(E2E_PASSWORD);
    await page.getByLabel('Confirm New Password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(page.getByText('Password changed successfully.')).toBeVisible();
    await expect(page).toHaveURL(/\/student\/dashboard$/, { timeout: 10_000 });

    // The flag must actually be cleared server-side too, not just client state —
    // logging in again with the old password should now fail.
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill(FRESH_STUDENT.email);
    await page.getByLabel('Password').fill(FRESH_STUDENT.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('p.text-red-600')).toBeVisible();
  });
});

test.describe('Logout (starts authenticated)', () => {
  test('logout works and blocks access to protected routes afterwards', async ({ browser }) => {
    const { context, page } = await authedContext(browser, STUDENT.email, STUDENT.password);
    await page.goto('/student/dashboard');
    await expect(page.getByRole('heading', { name: STUDENT.name })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/student/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });
});
