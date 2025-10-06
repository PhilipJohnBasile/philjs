import { test, expect } from '@playwright/test';

test('debug scroll behavior in real-time', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== REAL-TIME SCROLL DEBUG ===');

  // Inject scroll tracking
  await page.addInitScript(() => {
    let scrollCount = 0;
    const originalScrollTo = window.scrollTo;

    window.scrollTo = function(...args: any[]) {
      scrollCount++;
      console.log(`[SCROLL ${scrollCount}] scrollTo called:`, JSON.stringify(args));
      console.log(`  Current position: ${window.scrollY}px`);
      // @ts-ignore
      return originalScrollTo.apply(window, args);
    };

    // Track when scrolls happen
    window.addEventListener('scroll', () => {
      console.log(`[SCROLL EVENT] New position: ${window.scrollY}px`);
    });
  });

  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n--- Scrolling down to 500px ---');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  let scrollY = await page.evaluate(() => window.scrollY);
  console.log(`Verified scroll position: ${scrollY}px`);

  console.log('\n--- Clicking Quick Start link ---');
  const quickStartLink = page.locator('button').filter({ hasText: 'Quick Start' }).first();

  await quickStartLink.click();

  // Watch scroll in real-time
  await page.waitForTimeout(100);
  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After 100ms: ${scrollY}px`);

  await page.waitForTimeout(200);
  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After 300ms: ${scrollY}px`);

  await page.waitForTimeout(200);
  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After 500ms: ${scrollY}px`);

  await page.waitForTimeout(300);
  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After 800ms: ${scrollY}px`);

  if (scrollY === 0) {
    console.log('\n❌ PROBLEM: Scroll jumped instantly to 0');
  } else {
    console.log('\n✅ Scroll is animating or stayed put');
  }

  // Check if behavior: smooth is working
  console.log('\n--- Testing native smooth scroll ---');
  await page.evaluate(() => {
    console.log('[TEST] Scrolling to 300 with behavior: smooth');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  });

  await page.waitForTimeout(100);
  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After smooth scroll (100ms): ${scrollY}px`);

  await page.waitForTimeout(400);
  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After smooth scroll (500ms): ${scrollY}px`);

  if (scrollY > 200 && scrollY < 400) {
    console.log('✅ Browser smooth scroll works');
  } else {
    console.log('❌ Browser smooth scroll may not be working');
  }
});
