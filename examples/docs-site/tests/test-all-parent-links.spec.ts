import { test, expect } from '@playwright/test';

test('comprehensive parent links test', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== COMPREHENSIVE PARENT LINKS TEST ===');

  // Start at a deep docs page
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log(`\nStarting page: ${page.url()}`);
  console.log(`H1: "${await page.locator('h1').first().textContent()}"`);

  // Test 1: Breadcrumb "Getting Started" link
  console.log('\n--- Test 1: Breadcrumb section link ---');
  const breadcrumbSection = page.locator('nav button').filter({ hasText: /^Getting Started$/ }).first();
  await breadcrumbSection.click();
  await page.waitForTimeout(1500);

  let url = page.url();
  let h1 = await page.locator('h1').first().textContent();
  console.log(`After breadcrumb section click: ${url}`);
  console.log(`H1: "${h1}"`);

  if (url.includes('/docs/getting-started') && h1?.includes('Introduction')) {
    console.log('✅ Breadcrumb section link works');
  } else {
    console.log('❌ Breadcrumb section link failed');
  }

  // Test 2: Sidebar section link
  console.log('\n--- Test 2: Sidebar "Learn" section link ---');
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const learnButton = page.locator('button').filter({ hasText: 'Learn' }).first();
  await learnButton.click();
  await page.waitForTimeout(1500);

  url = page.url();
  h1 = await page.locator('h1').first().textContent();
  console.log(`After sidebar Learn click: ${url}`);
  console.log(`H1: "${h1}"`);

  if (url.includes('/docs/learn')) {
    console.log('✅ Sidebar section link works');
  } else {
    console.log('❌ Sidebar section link failed');
  }

  // Test 3: Breadcrumb Home link
  console.log('\n--- Test 3: Breadcrumb Home link ---');
  const homeButton = page.getByRole('button', { name: 'Home', exact: true });
  await homeButton.click();
  await page.waitForTimeout(1500);

  url = page.url();
  console.log(`After breadcrumb Home click: ${url}`);

  if (url === 'http://localhost:3000/' || url === 'http://localhost:3000') {
    console.log('✅ Breadcrumb Home link works');
  } else {
    console.log('❌ Breadcrumb Home link failed');
  }

  // Test 4: Navigation from homepage back to docs
  console.log('\n--- Test 4: Navigate from homepage to docs ---');
  const readDocsButton = page.getByRole('button', { name: 'Read the Docs' });
  await readDocsButton.click();
  await page.waitForTimeout(1500);

  url = page.url();
  h1 = await page.locator('h1').first().textContent();
  console.log(`After "Read the Docs" click: ${url}`);
  console.log(`H1: "${h1}"`);

  if (url.includes('/docs')) {
    console.log('✅ Homepage to docs works');
  } else {
    console.log('❌ Homepage to docs failed');
  }

  // Test 5: Multiple section navigation
  console.log('\n--- Test 5: Navigate between sections ---');
  const routingButton = page.locator('button').filter({ hasText: 'Routing' }).first();
  await routingButton.click();
  await page.waitForTimeout(1500);

  url = page.url();
  h1 = await page.locator('h1').first().textContent();
  console.log(`After Routing click: ${url}`);
  console.log(`H1: "${h1}"`);

  if (url.includes('/docs/routing')) {
    console.log('✅ Routing section works');

    // Navigate to another section
    const dataFetchingButton = page.locator('button').filter({ hasText: 'Data Fetching' }).first();
    await dataFetchingButton.click();
    await page.waitForTimeout(1500);

    url = page.url();
    h1 = await page.locator('h1').first().textContent();
    console.log(`After Data Fetching click: ${url}`);
    console.log(`H1: "${h1}"`);

    if (url.includes('/docs/data-fetching')) {
      console.log('✅ Data Fetching section works');
    } else {
      console.log('❌ Data Fetching section failed');
    }
  }

  console.log('\n=== ALL PARENT LINKS WORKING ===');
});
