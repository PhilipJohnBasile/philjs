import { test } from '@playwright/test';

test('check what actually renders on /docs', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`[BROWSER]:`, msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('[PAGE ERROR]:', error.message);
    console.error(error.stack);
  });

  await page.goto('http://localhost:3000/docs');
  await page.waitForTimeout(3000);

  // Check what's in the DOM
  const body = page.locator('body');
  const bodyHTML = await body.innerHTML();

  console.log('\n=== DOM STRUCTURE ===');
  console.log('Body innerHTML length:', bodyHTML.length);
  console.log('First 500 chars:', bodyHTML.substring(0, 500));

  // Check for specific elements
  const root = page.locator('#root');
  const rootHTML = await root.innerHTML();
  console.log('\n#root innerHTML length:', rootHTML.length);
  console.log('First 500 chars:', rootHTML.substring(0, 500));

  // Check if sidebar exists
  const sidebar = await page.locator('[class*="sidebar"], nav, aside').count();
  console.log('\nSidebar elements:', sidebar);

  // Check if article exists
  const article = await page.locator('article, [class*="prose"]').count();
  console.log('Article elements:', article);

  // Check for any text content
  const bodyText = await body.textContent();
  console.log('\nBody text length:', bodyText?.length || 0);
  console.log('First 200 chars:', bodyText?.substring(0, 200));

  await page.screenshot({ path: 'tests/screenshots/visual-check.png', fullPage: true });
});
