import { test, expect } from '@playwright/test';
import * as path from 'path';
import { authedContext } from '../fixtures/auth';
import { TEAM_LEADER_GROUP2, STUDENT_GROUP2 } from '../fixtures/seed-data';
import { uniqueName } from '../utils/unique';
import { createOpportunityDraft, publishOpportunity, startParticipation, beginWork, uploadProof } from '../utils/flows';

const SAMPLE_PDF = path.join(__dirname, '..', 'fixtures', 'sample.pdf');

test.describe('Participation and submission (Group 2 certification)', () => {
  test('team leader posts a certification; a group member starts it, uploads proof, and sees it pending', async ({ browser }) => {
    const title = uniqueName('E2E Submission Flow Cert');

    const tl = await authedContext(browser, TEAM_LEADER_GROUP2.email, TEAM_LEADER_GROUP2.password);
    await createOpportunityDraft(tl.page, { title, type: 'Training' });
    await publishOpportunity(tl.page, title);
    await tl.context.close();

    const student = await authedContext(browser, STUDENT_GROUP2.email, STUDENT_GROUP2.password);
    await startParticipation(student.page, false, title);
    await beginWork(student.page, false, title);
    await uploadProof(student.page, false, title, SAMPLE_PDF);

    await student.page.goto('/student/submissions');
    await expect(student.page.getByRole('heading', { name: 'My Submissions' })).toBeVisible();
    const submissionCard = student.page.locator('.rounded-xl').filter({ hasText: title }).first();
    await expect(submissionCard).toBeVisible();
    await expect(submissionCard.getByText('Pending Verification')).toBeVisible();
    await expect(submissionCard.getByText('sample.pdf')).toBeVisible();

    await student.context.close();
  });
});
