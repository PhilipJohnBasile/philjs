import { test, expect } from '@playwright/test';

test('test exact breadcrumb button', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING EXACT BREADCRUMB BUTTON ===');

  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log(`Initial URL: ${page.url()}`);

  // Find Home breadcrumb button
  console.log('\n--- Testing Home breadcrumb ---');
  const homeButton = page.getByRole('button', { name: 'Home', exact: true });
  const homeCount = await homeButton.count();
  console.log(`Found ${homeCount} Home button(s)`);

  if (homeCount > 0) {
    await homeButton.click();
    await page.waitForTimeout(1500);
    console.log(`After Home click: ${page.url()}`);

    if (page.url() === 'http://localhost:3000/' || page.url() === 'http://localhost:3000') {
      console.log('✅ Home navigation works!');
    } else {
      console.log('❌ Home navigation failed');
    }

    // Go back
    await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  // Find Getting Started breadcrumb button (exact match, not the sidebar toggle)
  console.log('\n--- Testing Getting Started breadcrumb ---');
  const sectionButton = page.getByRole('button', { name: 'Getting Started', exact: true });
  const sectionCount = await sectionButton.count();
  console.log(`Found ${sectionCount} "Getting Started" button(s) with exact match`);

  if (sectionCount > 0) {
    console.log('Clicking Getting Started breadcrumb...');
    await sectionButton.click();
    await page.waitForTimeout(1500);

    const newUrl = page.url();
    console.log(`After click: ${newUrl}`);

    // Check what page we're on
    const h1 = await page.locator('h1').first().textContent();
    console.log(`H1: "${h1}"`);

    if (newUrl.includes('introduction') || h1?.includes('Introduction')) {
      console.log('✅ Section navigation works - navigated to first doc in section!');
    } else if (newUrl.includes('getting-started') && !newUrl.includes('tutorial-demo-app')) {
      console.log('✅ Section navigation works - navigated to section!');
    } else {
      console.log('❌ Section navigation failed - still on same page');
    }
  } else {
    console.log('❌ No exact match button found');
  }
});
