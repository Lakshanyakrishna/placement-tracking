import { test, expect } from '@playwright/test';
import { authedContext } from '../fixtures/auth';
import { ADMIN, TEAM_LEADER_GROUP2, STUDENT, STUDENT_GROUP2 } from '../fixtures/seed-data';
import { uniqueName } from '../utils/unique';
import { createOpportunityDraft, publishOpportunity } from '../utils/flows';

// NOTE on scope: the task that requested this test described an admin flow that
// "creates an opportunity, edits it, sets targets". There is no such "set targets"
// feature in this app for admins — CreateOpportunityDto/UpdateOpportunityDto have
// no targetBranchId/targetSectionId/targetBatchId/targetGroupId fields at all, and
// neither the Create nor Edit opportunity page exposes any targeting UI for any
// role. The only targeting mechanism that actually exists is `visibilityScope`
// ('group' | 'section'), available only to mentors/team leaders, which the server
// auto-resolves to *their own* group/section — admin-created opportunities are
// always fully global by design. This test exercises the real targeting mechanism
// (team-leader group-scoping) instead of a nonexistent admin target picker.

test.describe('Admin: global opportunity lifecycle (create, edit, publish)', () => {
  test('create → edit → publish, then it is visible to students in every group', async ({ browser }) => {
    const { context, page } = await authedContext(browser, ADMIN.email, ADMIN.password);
    const title = uniqueName('E2E Global Placement');
    const editedTitle = `${title} (edited)`;

    await createOpportunityDraft(page, { title, type: 'Placement' });
    await expect(page.getByRole('row', { name: title })).toBeVisible();

    // Edit: rename it.
    await page.getByRole('row', { name: title }).getByRole('button', { name: 'Edit' }).click();
    await expect(page).toHaveURL(/\/admin\/opportunities\/.+\/edit$/);
    const titleInput = page.getByLabel('Title');
    await expect(titleInput).toHaveValue(title);
    await titleInput.fill(editedTitle);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page).toHaveURL(/\/admin\/opportunities$/);
    await expect(page.getByRole('row', { name: editedTitle })).toBeVisible();

    await publishOpportunity(page, editedTitle);
    await context.close();

    // A global (untargeted) opportunity must be visible to students in ANY group.
    for (const student of [STUDENT, STUDENT_GROUP2]) {
      const studentSession = await authedContext(browser, student.email, student.password);
      await studentSession.page.goto('/student/placements');
      await studentSession.page.getByRole('button', { name: 'Available', exact: true }).click();
      await expect(studentSession.page.getByText(editedTitle)).toBeVisible();
      await studentSession.context.close();
    }
  });
});

test.describe('Team leader: group-scoped certification targeting', () => {
  test('a group-scoped certification is only visible to students in that group', async ({ browser }) => {
    const { context, page } = await authedContext(browser, TEAM_LEADER_GROUP2.email, TEAM_LEADER_GROUP2.password);
    const title = uniqueName('E2E Group2 Certification');

    // Non-admin type options exclude Internship/Placement — Training is available.
    // This account only holds team_leader (not mentor), so scopeOptions has exactly
    // one entry ("My Group Only") and the visibilityScope field is auto-set without
    // ever rendering a dropdown — nothing to click for scope here.
    await createOpportunityDraft(page, { title, type: 'Training' });
    await publishOpportunity(page, title);
    await context.close();

    const group2Session = await authedContext(browser, STUDENT_GROUP2.email, STUDENT_GROUP2.password);
    await group2Session.page.goto('/student/certifications');
    await group2Session.page.getByRole('button', { name: 'Available', exact: true }).click();
    await expect(group2Session.page.getByText(title)).toBeVisible();
    await group2Session.context.close();

    const group1Session = await authedContext(browser, STUDENT.email, STUDENT.password);
    await group1Session.page.goto('/student/certifications');
    await group1Session.page.getByRole('button', { name: 'Available', exact: true }).click();
    await expect(group1Session.page.getByText(title)).not.toBeVisible();
    await group1Session.context.close();
  });
});
