import { test } from '@playwright/test';

test('check if homepage renders', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error('[ERROR]:', err.message));

  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);

  const rootHTML = await page.locator('#root').innerHTML();
  console.log('\nHomepage #root length:', rootHTML.length);
  console.log('Has content:', rootHTML.length > 0);

  if (rootHTML.length > 0) {
    console.log('First 200 chars:', rootHTML.substring(0, 200));
  }
});
