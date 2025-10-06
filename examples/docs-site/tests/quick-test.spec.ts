import { test } from '@playwright/test';

test('quick check', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));

  await page.goto('http://localhost:3000/docs');
  await page.waitForTimeout(3000);

  const bodyText = await page.locator('body').textContent();
  console.log('\nPage text:', bodyText?.substring(0, 500));

  await page.screenshot({ path: 'quick-test.png', fullPage: true });
});
