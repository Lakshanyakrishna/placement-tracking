import { chromium } from '@playwright/test';
const FRONTEND = 'http://localhost:5175';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(FRONTEND + '/?login=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const continueBtn = page.getByRole('button', { name: /continue to sign in/i });
  if (await continueBtn.count() > 0) { await continueBtn.click(); await page.waitForTimeout(600); }
  await page.locator('input[type="email"]:not([disabled])').first().fill('throwaway.viewtest@example.com');
  await page.locator('input[type="password"]').first().fill('ThrowawayTest@2026');
  await page.getByRole('button', { name: /log in|sign in/i }).last().click();
  await page.waitForTimeout(1500);
  console.log('URL after login:', page.url());

  await page.goto(FRONTEND + '/student/certifications', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'view-cert-list.png' });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByRole('button', { name: /view submission/i }).first().click(),
  ]);
  console.log('Download filename:', download.suggestedFilename());
  await browser.close();
};
run().catch((e) => { console.error(e); process.exit(1); });
