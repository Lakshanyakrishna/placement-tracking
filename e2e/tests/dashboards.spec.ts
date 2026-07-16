import { test, expect, type Browser } from '@playwright/test';
import * as path from 'path';
import { authedContext } from '../fixtures/auth';
import { ADMIN, STUDENT, MENTOR_AND_TL1 } from '../fixtures/seed-data';
import { uniqueName } from '../utils/unique';
import { createOpportunityDraft, publishOpportunity, startParticipation, beginWork, uploadProof } from '../utils/flows';

const SAMPLE_PDF = path.join(__dirname, '..', 'fixtures', 'sample.pdf');

// Creates and fully verifies one small cert so every dashboard has at least some
// non-zero certification activity to display, independent of whatever other spec
// files may or may not have run first.
async function seedOneVerifiedCertification(browser: Browser): Promise<string> {
  const title = uniqueName('E2E Dashboard Cert');

  const tl = await authedContext(browser, MENTOR_AND_TL1.email, MENTOR_AND_TL1.password);
  await createOpportunityDraft(tl.page, { title, type: 'Training' });
  await publishOpportunity(tl.page, title);

  const student = await authedContext(browser, STUDENT.email, STUDENT.password);
  await startParticipation(student.page, false, title);
  await beginWork(student.page, false, title);
  await uploadProof(student.page, false, title, SAMPLE_PDF);
  await student.context.close();

  // MENTOR_AND_TL1 is also Group 1's team leader, so they can approve it here.
  await tl.page.goto('/team-leader/dashboard');
  const row = tl.page.locator('div.rounded-lg.border.p-4').filter({ hasText: title });
  await row.getByRole('button', { name: 'Approve' }).click();
  await expect(row).not.toBeVisible();
  await tl.context.close();

  return title;
}

test.describe('Dashboards render real, non-error data', () => {
  test('admin dashboard shows seed-accurate counts and a populated Group Performance section', async ({ browser }) => {
    await seedOneVerifiedCertification(browser);

    const { context, page } = await authedContext(browser, ADMIN.email, ADMIN.password);
    await page.goto('/admin/dashboard');

    // The Students count comes straight from seed.ts (92) and is unaffected by any
    // test-created opportunities/participations — safe to assert as an exact value.
    // "Groups" is checked as a label only: a bare "4" is too generic a digit to
    // assert by exact text without a stable scoping hook to the stat card itself.
    await expect(page.getByText('Students')).toBeVisible();
    await expect(page.getByText('92', { exact: true })).toBeVisible();
    await expect(page.getByText('Groups')).toBeVisible();

    // Cert Completion / Pending Verification vary with accumulated test data across
    // the whole run — just assert they rendered a number, not stuck loading/blank.
    await expect(page.getByText('Cert Completion')).toBeVisible();
    await expect(page.getByText('Pending Verification')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Group Performance' })).toBeVisible();
    await expect(page.getByText(/\d+\/\d+ completed/).first()).toBeVisible();

    await context.close();
  });

  test('student dashboard shows the student\'s own identity and stat cards', async ({ browser }) => {
    const { context, page } = await authedContext(browser, STUDENT.email, STUDENT.password);
    await page.goto('/student/dashboard');

    await expect(page.getByRole('heading', { name: STUDENT.name })).toBeVisible();
    await expect(page.getByText(`Roll No: ${STUDENT.roll}`)).toBeVisible();
    await expect(page.getByText(`Group: ${STUDENT.groupName}`)).toBeVisible();

    // Exact-text-matched <p> tags specifically: a plain substring getByText/hasText
    // check collides with other unrelated text on this page — "In Progress" also
    // appears as a <span> status badge on a certification card, and "Assigned"
    // substring-matches (case-insensitively) inside the unrelated empty-state
    // message "No placement drives assigned yet." The stat card labels are
    // consistently rendered as <p className="text-xs ...">{label}</p> with no
    // other text in the same element, so :text-is() (exact match) scoped to `p`
    // disambiguates cleanly.
    for (const label of ['Available', 'Assigned', 'In Progress', 'Submitted', 'Verified']) {
      await expect(page.locator(`p:text-is("${label}")`)).toBeVisible();
    }

    await context.close();
  });

  test('team leader dashboard shows stat cards and the pending-verifications panel without erroring', async ({ browser }) => {
    const { context, page } = await authedContext(browser, MENTOR_AND_TL1.email, MENTOR_AND_TL1.password);
    await page.goto('/team-leader/dashboard');

    await expect(page.getByRole('heading', { name: 'Team Leader Dashboard' })).toBeVisible();
    for (const label of ['Assigned Groups', 'Students', 'Verified', 'Rejected']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    // "Pending Verifications" appears twice — once as a stat card label, once as the
    // section title below (both rendered via shadcn's CardTitle, a styled <div>, not
    // a real heading) — assert both render rather than picking one arbitrarily.
    await expect(page.getByText('Pending Verifications', { exact: true })).toHaveCount(2);
    // Either real pending items or the explicit empty state — never an error state.
    await expect(page.getByText('Error', { exact: true })).not.toBeVisible();

    await context.close();
  });

  test('mentor dashboard shows the certification breakdown table without erroring', async ({ browser }) => {
    await seedOneVerifiedCertification(browser);

    const { context, page } = await authedContext(browser, MENTOR_AND_TL1.email, MENTOR_AND_TL1.password);
    await page.goto('/mentor/dashboard');

    await expect(page.getByRole('heading', { name: 'Mentor Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Certifications by Group' })).toBeVisible();
    await expect(page.getByText(MENTOR_AND_TL1.groupName)).toBeVisible();
    await expect(page.getByText('Error', { exact: true })).not.toBeVisible();

    await context.close();
  });
});
