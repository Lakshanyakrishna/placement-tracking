import { test, expect } from '@playwright/test';
import * as path from 'path';
import { authedContext } from '../fixtures/auth';
import { TEAM_LEADER_GROUP2, STUDENT_GROUP2 } from '../fixtures/seed-data';
import { uniqueName } from '../utils/unique';
import { createOpportunityDraft, publishOpportunity, startParticipation, beginWork, uploadProof, reuploadProof, findCard } from '../utils/flows';

const SAMPLE_PDF = path.join(__dirname, '..', 'fixtures', 'sample.pdf');

// NOTE on scope: the task described "mentor/admin sees the pending submission in the
// verification queue, approves one and rejects another". That page doesn't exist as
// an interactive feature for those roles: /admin/verifications (admin-only) is a
// read-only list with no action buttons at all, and mentors have no dedicated
// verification queue page (their dashboard only shows the certification breakdown
// table). The only interactive approve/reject UI in the whole app lives on the Team
// Leader dashboard (/team-leader/dashboard) — this test uses that instead of a
// nonexistent admin/mentor action queue.

test.describe('Verification: approve, reject with reason, and resubmission (Team Leader dashboard)', () => {
  test('team leader approves one submission and rejects another; student sees updated statuses and can resubmit the rejected one', async ({ browser }) => {
    const approveTitle = uniqueName('E2E Verify Approve');
    const rejectTitle = uniqueName('E2E Verify Reject');
    const rejectionReason = 'Certificate image is unreadable, please re-upload a clearer scan.';

    const tl = await authedContext(browser, TEAM_LEADER_GROUP2.email, TEAM_LEADER_GROUP2.password);
    await createOpportunityDraft(tl.page, { title: approveTitle, type: 'Training' });
    await publishOpportunity(tl.page, approveTitle);
    await createOpportunityDraft(tl.page, { title: rejectTitle, type: 'Training' });
    await publishOpportunity(tl.page, rejectTitle);

    const student = await authedContext(browser, STUDENT_GROUP2.email, STUDENT_GROUP2.password);
    for (const title of [approveTitle, rejectTitle]) {
      await startParticipation(student.page, false, title);
      await beginWork(student.page, false, title);
      await uploadProof(student.page, false, title, SAMPLE_PDF);
    }

    // Team leader dashboard: approve one, reject the other with a reason.
    // "Pending Verifications" text is rendered via shadcn's CardTitle (a styled
    // <div>, not a real heading) and appears twice on this page (a stat card label
    // plus the section title below) — .first() just confirms the page loaded.
    await tl.page.goto('/team-leader/dashboard');
    await expect(tl.page.getByText('Pending Verifications', { exact: true }).first()).toBeVisible();

    const pendingRow = (title: string) => tl.page.locator('div.rounded-lg.border.p-4').filter({ hasText: title });

    await expect(pendingRow(approveTitle)).toBeVisible();
    await pendingRow(approveTitle).getByRole('button', { name: 'Approve' }).click();
    await expect(pendingRow(approveTitle)).not.toBeVisible();

    await expect(pendingRow(rejectTitle)).toBeVisible();
    await pendingRow(rejectTitle).getByRole('button', { name: 'Reject' }).click();
    const dialog = tl.page.getByRole('dialog');
    await expect(dialog.getByText('Reject Submission')).toBeVisible();
    await dialog.getByPlaceholder('Enter rejection reason...').fill(rejectionReason);
    await dialog.getByRole('button', { name: 'Reject' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(pendingRow(rejectTitle)).not.toBeVisible();

    // Student side: statuses reflect the team leader's decisions.
    await student.page.goto('/student/certifications');
    await student.page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(findCard(student.page, approveTitle).getByText('Verified')).toBeVisible();
    const rejectedCard = findCard(student.page, rejectTitle);
    await expect(rejectedCard.getByText('Rejected')).toBeVisible();
    await expect(rejectedCard.getByText(rejectionReason)).toBeVisible();

    // Resubmission: the rejected certification can be re-uploaded and goes back to pending.
    await reuploadProof(student.page, false, rejectTitle, SAMPLE_PDF);
    await student.page.goto('/student/submissions');
    const resubmittedCard = student.page.locator('.rounded-xl').filter({ hasText: rejectTitle }).first();
    await expect(resubmittedCard.getByText('Pending Verification')).toBeVisible();

    await tl.context.close();
    await student.context.close();
  });
});
