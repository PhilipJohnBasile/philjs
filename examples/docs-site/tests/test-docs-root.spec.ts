import { test, expect } from '@playwright/test';

test('test navigating to /docs/ root', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING /docs/ ROOT URL ===');

  // Navigate to just /docs/
  console.log('\n--- Navigating to http://localhost:3000/docs/ ---');
  await page.goto('http://localhost:3000/docs/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const url = page.url();
  console.log(`Current URL: ${url}`);

  const bodyText = await page.locator('body').textContent();
  const bodyLength = bodyText?.length || 0;
  console.log(`Body length: ${bodyLength} chars`);

  const h1 = await page.locator('h1').first().textContent();
  console.log(`H1: "${h1}"`);

  // Check if it redirected or loaded a default page
  if (url === 'http://localhost:3000/docs/' || url === 'http://localhost:3000/docs') {
    console.log('⚠️  Still at /docs/ - no automatic redirect');
  } else {
    console.log(`Redirected to: ${url}`);
  }

  // Check for breadcrumbs
  console.log('\n--- Checking for breadcrumbs ---');
  const homeButton = page.getByRole('button', { name: 'Home', exact: true });
  const homeCount = await homeButton.count();
  console.log(`Home button exists: ${homeCount > 0}`);

  if (homeCount > 0) {
    console.log('Testing Home button click...');
    await homeButton.click();
    await page.waitForTimeout(1500);
    console.log(`After Home click: ${page.url()}`);
  }

  // Try navigating from homepage to /docs
  console.log('\n--- Testing navigation from homepage ---');
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const docsButton = page.getByRole('button', { name: 'Read the Docs' });
  const docsCount = await docsButton.count();
  console.log(`"Read the Docs" button exists: ${docsCount > 0}`);

  if (docsCount > 0) {
    await docsButton.click();
    await page.waitForTimeout(1500);
    const afterClickUrl = page.url();
    console.log(`After clicking "Read the Docs": ${afterClickUrl}`);

    const afterH1 = await page.locator('h1').first().textContent();
    console.log(`H1 after click: "${afterH1}"`);

    // Now try clicking Home breadcrumb
    console.log('\n--- Testing breadcrumb from docs page ---');
    const breadcrumbHome = page.getByRole('button', { name: 'Home', exact: true });
    const breadcrumbHomeCount = await breadcrumbHome.count();

    if (breadcrumbHomeCount > 0) {
      console.log('Clicking Home breadcrumb...');
      await breadcrumbHome.click();
      await page.waitForTimeout(1500);
      console.log(`After breadcrumb Home click: ${page.url()}`);

      const finalH1 = await page.locator('h1').first().textContent();
      console.log(`Final H1: "${finalH1}"`);

      if (finalH1?.includes('PhilJS') && page.url() === 'http://localhost:3000/') {
        console.log('✅ Breadcrumb Home works!');
      } else {
        console.log('❌ Breadcrumb Home failed');
      }
    }
  }
});
