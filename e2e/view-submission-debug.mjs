import { chromium } from '@playwright/test';
const FRONTEND = 'http://localhost:5175';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, acceptDownloads: true });
  page.on('console', m => console.log('CONSOLE:', m.text()));
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('response', async (res) => {
    if (res.url().includes('/submissions')) console.log(res.status(), res.url());
  });
  await page.goto(FRONTEND + '/?login=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const continueBtn = page.getByRole('button', { name: /continue to sign in/i });
  if (await continueBtn.count() > 0) { await continueBtn.click(); await page.waitForTimeout(600); }
  await page.locator('input[type="email"]:not([disabled])').first().fill('throwaway.viewtest@example.com');
  await page.locator('input[type="password"]').first().fill('ThrowawayTest@2026');
  await page.getByRole('button', { name: /log in|sign in/i }).last().click();
  await page.waitForTimeout(1500);

  await page.goto(FRONTEND + '/student/certifications', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: /view submission/i }).first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'view-cert-after-click.png' });

  await browser.close();
};
run().catch((e) => { console.error(e); process.exit(1); });
