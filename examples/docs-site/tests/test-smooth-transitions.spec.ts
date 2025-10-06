import { test, expect } from '@playwright/test';

test('verify smooth transitions and no page jumps', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  // Track navigation events
  let navigationCount = 0;
  let fullPageLoadCount = 0;

  page.on('domcontentloaded', () => {
    fullPageLoadCount++;
    console.log(`[PAGE LOAD ${fullPageLoadCount}] DOMContentLoaded fired`);
  });

  console.log('\n=== TESTING SMOOTH TRANSITIONS ===');

  // Navigate to docs page
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log(`\n--- Initial page load ---`);
  console.log(`URL: ${page.url()}`);
  const initialLoadCount = fullPageLoadCount;

  // Test 1: Click sidebar link
  console.log('\n--- Test 1: Sidebar navigation ---');
  const quickStartLink = page.locator('button').filter({ hasText: 'Quick Start' }).first();
  await quickStartLink.click();
  await page.waitForTimeout(1000);

  const afterSidebarUrl = page.url();
  console.log(`After sidebar click: ${afterSidebarUrl}`);
  console.log(`Full page loads since start: ${fullPageLoadCount - initialLoadCount}`);

  if (fullPageLoadCount === initialLoadCount) {
    console.log('✅ No full page reload - smooth client-side navigation');
  } else {
    console.log('❌ Full page reload occurred');
  }

  // Test 2: Click breadcrumb
  console.log('\n--- Test 2: Breadcrumb navigation ---');
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const beforeBreadcrumbLoads = fullPageLoadCount;

  const homeButton = page.getByRole('button', { name: 'Home', exact: true });
  await homeButton.click();
  await page.waitForTimeout(1000);

  console.log(`After breadcrumb click: ${page.url()}`);
  console.log(`Full page loads: ${fullPageLoadCount - beforeBreadcrumbLoads}`);

  if (fullPageLoadCount === beforeBreadcrumbLoads) {
    console.log('✅ Breadcrumb navigation is smooth');
  } else {
    console.log('❌ Breadcrumb caused page reload');
  }

  // Test 3: Click internal markdown link
  console.log('\n--- Test 3: Internal markdown link ---');
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const beforeMarkdownLinkLoads = fullPageLoadCount;

  // Look for a link to another tutorial in the markdown content
  const markdownContent = page.locator('#markdown-content');
  const internalLink = markdownContent.locator('a[href^="/"]').first();
  const linkCount = await internalLink.count();

  if (linkCount > 0) {
    const linkHref = await internalLink.getAttribute('href');
    console.log(`Found internal link: ${linkHref}`);

    await internalLink.click();
    await page.waitForTimeout(1000);

    console.log(`After markdown link click: ${page.url()}`);
    console.log(`Full page loads: ${fullPageLoadCount - beforeMarkdownLinkLoads}`);

    if (fullPageLoadCount === beforeMarkdownLinkLoads) {
      console.log('✅ Internal markdown link used smooth navigation');
    } else {
      console.log('❌ Internal markdown link caused page reload');
    }
  } else {
    console.log('⚠️  No internal links found in markdown');
  }

  // Test 4: Visual test - capture screenshots during transition
  console.log('\n--- Test 4: Visual transition test ---');
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Navigate and check for visual smoothness
  const learnLink = page.locator('button').filter({ hasText: 'Learn' }).first();

  // Start navigation
  const navigationPromise = learnLink.click();

  // Give time for transition to start
  await page.waitForTimeout(50);

  // Check if content is still visible (should fade, not jump)
  const bodyOpacity = await page.evaluate(() => {
    const router = document.getElementById('router-container');
    return router ? window.getComputedStyle(router).opacity : '1';
  });

  console.log(`Body opacity during transition: ${bodyOpacity}`);

  await navigationPromise;
  await page.waitForTimeout(500);

  console.log(`Final URL: ${page.url()}`);
  console.log('✅ Transition test complete');

  console.log('\n=== SUMMARY ===');
  console.log(`Total full page loads: ${fullPageLoadCount}`);
  console.log(`Expected: 3 (initial + 2 manual navigations for tests)`);

  if (fullPageLoadCount <= 3) {
    console.log('✅ All navigations use smooth client-side routing');
  } else {
    console.log('❌ Some navigations caused full page reloads');
  }
});
