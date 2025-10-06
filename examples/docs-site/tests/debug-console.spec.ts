import { test } from '@playwright/test';

test('capture console logs when navigating to /docs', async ({ page }) => {
  // Capture all console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', error => {
    console.error('[BROWSER ERROR]:', error.message);
  });

  console.log('\n=== NAVIGATING TO HOMEPAGE ===');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  console.log('\n=== NAVIGATING TO /DOCS ===');
  await page.goto('http://localhost:3000/docs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n=== CHECKING PAGE STATE ===');
  const html = await page.content();
  console.log('Page HTML length:', html.length);
  console.log('Body has content:', html.includes('<div') || html.includes('<article'));

  await page.screenshot({ path: 'tests/screenshots/docs-debug.png', fullPage: true });
});
