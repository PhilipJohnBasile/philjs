import { test } from '@playwright/test';

test('debug test', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  await page.goto('http://localhost:3000/docs');
  await page.waitForTimeout(2000);

  const bodyText = await page.locator('body').textContent();
  console.log('Body text length:', bodyText?.length);
  console.log('First 200 chars:', bodyText?.substring(0, 200));
});
