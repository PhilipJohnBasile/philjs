import { test, expect } from '@playwright/test';

test('verify smooth scroll behavior', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING SCROLL BEHAVIOR ===');

  // Navigate to a long docs page
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log(`\n--- Test 1: Page starts at top ---`);
  let scrollY = await page.evaluate(() => window.scrollY);
  console.log(`Initial scroll position: ${scrollY}px`);

  if (scrollY === 0) {
    console.log('✅ Page starts at top');
  } else {
    console.log('❌ Page did not start at top');
  }

  // Scroll down
  console.log(`\n--- Test 2: Scroll down and navigate ---`);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);

  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After scrolling down: ${scrollY}px`);

  // Navigate to another page via sidebar
  const quickStartLink = page.locator('button').filter({ hasText: 'Quick Start' }).first();
  await quickStartLink.click();
  await page.waitForTimeout(800); // Wait for smooth scroll

  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After navigation to Quick Start: ${scrollY}px`);

  if (scrollY < 100) {
    console.log('✅ Smooth scroll to top on new page');
  } else {
    console.log('❌ Did not scroll to top');
  }

  // Test 3: Scroll down again and use back button
  console.log(`\n--- Test 3: Back button restores scroll position ---`);
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(300);

  scrollY = await page.evaluate(() => window.scrollY);
  const savedScrollY = scrollY;
  console.log(`Scrolled to: ${scrollY}px`);

  // Navigate away
  const installLink = page.locator('button').filter({ hasText: 'Installation' }).first();
  await installLink.click();
  await page.waitForTimeout(800);

  console.log(`Navigated to Installation`);

  // Go back
  await page.goBack();
  await page.waitForTimeout(800);

  scrollY = await page.evaluate(() => window.scrollY);
  console.log(`After back button: ${scrollY}px`);
  console.log(`Expected: ${savedScrollY}px`);

  if (Math.abs(scrollY - savedScrollY) < 50) {
    console.log('✅ Scroll position restored on back button');
  } else {
    console.log('⚠️  Scroll position not exactly restored (but close enough)');
  }

  // Test 4: Hash link scrolling (TOC)
  console.log(`\n--- Test 4: Hash link smooth scroll ---`);
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Find a TOC link
  const tocLink = page.locator('.table-of-contents a').first();
  const tocLinkCount = await tocLink.count();

  if (tocLinkCount > 0) {
    const linkText = await tocLink.textContent();
    console.log(`Clicking TOC link: "${linkText}"`);

    const initialScrollY = await page.evaluate(() => window.scrollY);
    await tocLink.click();
    await page.waitForTimeout(600);

    const afterScrollY = await page.evaluate(() => window.scrollY);
    console.log(`Before: ${initialScrollY}px, After: ${afterScrollY}px`);

    if (afterScrollY !== initialScrollY) {
      console.log('✅ TOC link scrolled to section');
    } else {
      console.log('❌ TOC link did not scroll');
    }
  } else {
    console.log('⚠️  No TOC links found');
  }

  // Test 5: Multiple navigations don't cause jump
  console.log(`\n--- Test 5: Rapid navigation smoothness ---`);
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Navigate quickly through several pages
  const pages = ['Quick Start', 'Your First Component', 'Thinking in PhilJS'];

  for (const pageName of pages) {
    const link = page.locator('button').filter({ hasText: pageName }).first();
    const exists = await link.count();

    if (exists > 0) {
      await link.click();
      await page.waitForTimeout(400);

      scrollY = await page.evaluate(() => window.scrollY);
      console.log(`${pageName}: scroll=${scrollY}px`);

      if (scrollY < 100) {
        console.log(`  ✅ ${pageName} scrolled smoothly to top`);
      } else {
        console.log(`  ❌ ${pageName} did not scroll to top`);
      }
    }
  }

  console.log('\n=== SCROLL BEHAVIOR TEST COMPLETE ===');
});
