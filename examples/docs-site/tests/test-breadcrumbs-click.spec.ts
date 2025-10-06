import { test, expect } from '@playwright/test';

test('test clicking breadcrumb buttons', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING BREADCRUMB BUTTON CLICKS ===');

  // Navigate to a deep docs page
  console.log('\n--- Navigating to tutorial page ---');
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const initialUrl = page.url();
  console.log(`Initial URL: ${initialUrl}`);

  // Check body content
  let bodyText = await page.locator('body').textContent();
  const initialLength = bodyText?.length || 0;
  console.log(`Initial body length: ${initialLength} chars`);
  console.log(`Initial body contains "Tutorial: Build a Demo App": ${bodyText?.includes('Tutorial: Build a Demo App')}`);

  // Try clicking the Home button in breadcrumbs
  console.log('\n--- Clicking Home button in breadcrumbs ---');
  const homeButton = page.locator('button', { hasText: 'Home' }).first();
  const homeButtonExists = await homeButton.count();
  console.log(`Home button exists: ${homeButtonExists > 0}`);

  if (homeButtonExists > 0) {
    await homeButton.click();
    await page.waitForTimeout(1500);

    const afterHomeUrl = page.url();
    console.log(`URL after Home click: ${afterHomeUrl}`);

    bodyText = await page.locator('body').textContent();
    const afterHomeLength = bodyText?.length || 0;
    console.log(`Body length after Home click: ${afterHomeLength} chars`);
    console.log(`Body contains "PhilJS - The framework that thinks ahead": ${bodyText?.includes('PhilJS - The framework that thinks ahead')}`);

    if (afterHomeUrl === 'http://localhost:3000/' || afterHomeUrl === 'http://localhost:3000') {
      console.log('✅ URL changed to home');
    } else {
      console.log('❌ URL did not change to home');
    }

    if (bodyText?.includes('PhilJS - The framework that thinks ahead') || bodyText?.includes('Read the Docs')) {
      console.log('✅ Home page content loaded');
    } else {
      console.log('❌ Home page content NOT loaded');
      console.log('First 300 chars:', bodyText?.substring(0, 300));
    }
  }

  // Go back to docs page
  console.log('\n--- Navigating back to tutorial page ---');
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Try clicking the section button
  console.log('\n--- Clicking Getting Started button in breadcrumbs ---');
  const sectionButton = page.locator('button', { hasText: 'Getting Started' }).first();
  const sectionButtonExists = await sectionButton.count();
  console.log(`Getting Started button exists: ${sectionButtonExists > 0}`);

  if (sectionButtonExists > 0) {
    await sectionButton.click();
    await page.waitForTimeout(1500);

    const afterSectionUrl = page.url();
    console.log(`URL after section click: ${afterSectionUrl}`);

    bodyText = await page.locator('body').textContent();
    const afterSectionLength = bodyText?.length || 0;
    console.log(`Body length after section click: ${afterSectionLength} chars`);

    // The section page should load the first doc in that section
    const expectedUrl = 'http://localhost:3000/docs/getting-started';
    if (afterSectionUrl.startsWith(expectedUrl)) {
      console.log('✅ URL changed to section page');
    } else {
      console.log('❌ URL did not change to section page');
    }
  }
});
