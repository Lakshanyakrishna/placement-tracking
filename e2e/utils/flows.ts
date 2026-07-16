import { type Page, type Locator, expect } from '@playwright/test';

// Radix's Select renders a visible custom trigger (a <span> showing the current
// value/placeholder) alongside a visually-hidden native <select> for form/a11y
// fallback purposes, whose <option> text can be identical to the visible span's
// text (e.g. once a value is selected). getByRole('combobox', {name}) and a plain
// getByText both end up matching BOTH elements in that case — a strict-mode
// violation that manifests as an indefinite hang/timeout rather than a clean
// error. Scoping to the `span` tag specifically (confirmed via a standalone repro
// outside the test runner) avoids the hidden <option> entirely.
export async function selectComboboxOption(page: Page, triggerText: string, optionName: string) {
  await page.locator('span', { hasText: triggerText }).first().click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

/** Fills the Create Opportunity form and submits it (leaves the resulting draft unpublished). */
export async function createOpportunityDraft(page: Page, opts: { title: string; type: string }) {
  await page.goto('/admin/opportunities/new');
  await page.getByLabel('Title').fill(opts.title);
  await selectComboboxOption(page, 'Select type', opts.type);
  // Only one academic period exists in seed data — CreatePage auto-selects it; wait
  // for that before submitting so the form doesn't reject a still-empty field.
  await expect(page.locator('span', { hasText: /Semester 1/ })).toBeVisible();
  await page.getByRole('button', { name: 'Create Draft' }).click();
  await expect(page).toHaveURL(/\/admin\/opportunities$/);
}

export async function publishOpportunity(page: Page, title: string) {
  await page.goto('/admin/opportunities');
  const row = page.getByRole('row', { name: title });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Publish' }).click();
  await expect(row.getByText('published')).toBeVisible();
}

export async function createAndPublishOpportunity(page: Page, opts: { title: string; type: string }) {
  await createOpportunityDraft(page, opts);
  await publishOpportunity(page, opts.title);
}

function certOrPlacementPath(isPlacement: boolean): string {
  return isPlacement ? '/student/placements' : '/student/certifications';
}

/** Locates the single card whose visible text includes `title` on the current page. */
export function findCard(page: Page, title: string): Locator {
  return page.locator('.rounded-xl').filter({ hasText: title }).first();
}

/** From the "Available" tab, starts a participation for the named opportunity. */
export async function startParticipation(page: Page, isPlacement: boolean, title: string): Promise<void> {
  await page.goto(certOrPlacementPath(isPlacement));
  await page.getByRole('button', { name: 'Available', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();
  await findCard(page, title).getByRole('button', { name: 'Start' }).click();
  // The item should disappear from "Available" once a participation exists for it.
  await expect(page.getByText(title)).not.toBeVisible();
}

/**
 * Moves an existing not_started participation to in_progress by clicking its "Start"
 * button under the "All"/"Not Started" tab (a distinct action from startParticipation
 * above, which creates the participation in the first place).
 */
export async function beginWork(page: Page, isPlacement: boolean, title: string): Promise<void> {
  await page.goto(certOrPlacementPath(isPlacement));
  await page.getByRole('button', { name: 'All', exact: true }).click();
  const card = findCard(page, title);
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Start' }).click();
  await expect(card.getByRole('button', { name: 'Upload' })).toBeVisible();
}

/**
 * Uploads a proof file for an in_progress participation via the card's "Upload"
 * button, and waits for the resulting submission to actually land server-side
 * (card status flips to "Submitted") before returning. Without this wait, a caller
 * that immediately checks another page (e.g. the team leader's pending-verification
 * queue, fetched once on mount with no auto-refetch) can load before the upload's
 * own async createSubmission() call has finished — Playwright's retry only re-checks
 * the current DOM, it doesn't force a refetch, so a too-early check would otherwise
 * see a permanently empty queue no matter how long it waits.
 */
export async function uploadProof(page: Page, isPlacement: boolean, title: string, filePath: string): Promise<void> {
  await page.goto(certOrPlacementPath(isPlacement));
  await page.getByRole('button', { name: 'All', exact: true }).click();
  const card = findCard(page, title);
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    card.getByRole('button', { name: 'Upload' }).click(),
  ]);
  await fileChooser.setFiles(filePath);
  await expect(card.getByText('Submitted', { exact: true })).toBeVisible();
}

/** Re-uploads a proof file for a rejected participation via the card's "Re-upload"
 * button, waiting for the same "Submitted" status flip as uploadProof (see its
 * doc comment for why this wait matters). */
export async function reuploadProof(page: Page, isPlacement: boolean, title: string, filePath: string): Promise<void> {
  await page.goto(certOrPlacementPath(isPlacement));
  await page.getByRole('button', { name: 'All', exact: true }).click();
  const card = findCard(page, title);
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    card.getByRole('button', { name: 'Re-upload' }).click(),
  ]);
  await fileChooser.setFiles(filePath);
  await expect(card.getByText('Submitted', { exact: true })).toBeVisible();
}
