import { test, expect } from '@playwright/test';
import { apiLogin, API_URL } from '../fixtures/auth';
import { ADMIN, STUDENT, BRANCH_CODE, SECTION_CODE } from '../fixtures/seed-data';
import { uniqueSuffix } from '../utils/unique';
import { buildStudentsWorkbook, buildInvalidRowWorkbook, buildMissingColumnWorkbook } from '../utils/xlsx';

// NOTE on scope: the task described uploading through an admin-facing import UI
// ("admin uploads a small valid students Excel file"). No such UI exists anywhere
// in the frontend — router.tsx has no import route, and a repo-wide search turns up
// no import-related page, component, or API client call. Bulk import
// (`POST /imports/students/{validate,import}`, admin-only, multipart field `file`)
// is currently a backend-only, API-only feature. This test exercises it directly
// via HTTP, which is the only way to test it as it actually exists today.

test.describe('Student bulk import (API — no frontend UI exists for this feature)', () => {
  test('a valid file validates and imports successfully', async ({ request }) => {
    const { accessToken } = await apiLogin(request, ADMIN.email, ADMIN.password);
    const suffix = uniqueSuffix();
    const rows = [
      { rollNumber: `E2E${suffix}A`, name: 'Import Test A', email: `e2e-import-${suffix}-a@placementtracker.edu`, branchCode: BRANCH_CODE, sectionCode: SECTION_CODE, groupName: 'Group 1' },
      { rollNumber: `E2E${suffix}B`, name: 'Import Test B', email: `e2e-import-${suffix}-b@placementtracker.edu`, branchCode: BRANCH_CODE, sectionCode: SECTION_CODE, groupName: 'Group 1' },
    ];
    const buffer = await buildStudentsWorkbook(rows);

    const validateResponse = await request.post(`${API_URL}/imports/students/validate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: { file: { name: 'students.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer } },
    });
    expect(validateResponse.ok()).toBeTruthy();
    const validateBody = (await validateResponse.json()).data;
    expect(validateBody.valid).toBe(true);
    expect(validateBody.summary.validRows).toBe(2);
    expect(validateBody.errors).toHaveLength(0);

    const importResponse = await request.post(`${API_URL}/imports/students/import`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: { file: { name: 'students.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer } },
    });
    expect(importResponse.status()).toBe(201);
    const importBody = (await importResponse.json()).data;
    expect(importBody.successCount).toBe(2);
    expect(importBody.failureCount).toBe(0);
  });

  test('a row referencing a nonexistent branch code produces a row-level error', async ({ request }) => {
    const { accessToken } = await apiLogin(request, ADMIN.email, ADMIN.password);
    const suffix = uniqueSuffix();
    const buffer = await buildInvalidRowWorkbook({
      rollNumber: `E2E${suffix}C`,
      name: 'Import Test C',
      email: `e2e-import-${suffix}-c@placementtracker.edu`,
      branchCode: 'NOPE-DOES-NOT-EXIST',
      sectionCode: SECTION_CODE,
      groupName: 'Group 1',
    });

    const response = await request.post(`${API_URL}/imports/students/validate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: { file: { name: 'students.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer } },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()).data;
    expect(body.valid).toBe(false);
    expect(body.errors.length).toBeGreaterThan(0);
    expect(body.errors.some((e: { column: string; message: string }) =>
      e.column === 'branch_code' && e.message.includes('not found in system'),
    )).toBe(true);
  });

  test('a file missing a required column header is rejected before row validation', async ({ request }) => {
    const { accessToken } = await apiLogin(request, ADMIN.email, ADMIN.password);
    const buffer = await buildMissingColumnWorkbook();

    const response = await request.post(`${API_URL}/imports/students/validate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: { file: { name: 'students.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer } },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).toContain('Missing required columns');
  });

  test('a non-admin role is rejected with 403', async ({ request }) => {
    const { accessToken } = await apiLogin(request, STUDENT.email, STUDENT.password);
    const buffer = await buildStudentsWorkbook([]);

    const response = await request.post(`${API_URL}/imports/students/validate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: { file: { name: 'students.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer } },
    });
    expect(response.status()).toBe(403);
  });
});
