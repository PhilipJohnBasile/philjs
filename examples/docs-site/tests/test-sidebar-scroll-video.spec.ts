import { test, expect } from '@playwright/test';

test('record sidebar scroll behavior', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));

  // Start recording
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n=== RECORDING SIDEBAR SCROLL ===');

  // Take initial screenshot
  await page.screenshot({ path: 'sidebar-scroll-1-initial.png', fullPage: true });
  console.log('Screenshot 1: Initial state');

  // Scroll sidebar down a bit
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.scrollTop = 150;
      sidebar.dispatchEvent(new Event('scroll'));
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'sidebar-scroll-2-scrolled.png', fullPage: true });
  console.log('Screenshot 2: After scrolling to 150px');

  // Wait a bit
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'sidebar-scroll-3-after-wait.png', fullPage: true });
  console.log('Screenshot 3: After waiting 500ms');

  // Click a link
  console.log('\n=== CLICKING LINK ===');
  const quickStartLink = page.locator('.sidebar button').filter({ hasText: 'Quick Start' }).first();
  await quickStartLink.click();

  // Take screenshots at different intervals during navigation
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'sidebar-scroll-4-nav-100ms.png', fullPage: true });
  console.log('Screenshot 4: 100ms after click');

  await page.waitForTimeout(200);
  await page.screenshot({ path: 'sidebar-scroll-5-nav-300ms.png', fullPage: true });
  console.log('Screenshot 5: 300ms after click');

  await page.waitForTimeout(200);
  await page.screenshot({ path: 'sidebar-scroll-6-nav-500ms.png', fullPage: true });
  console.log('Screenshot 6: 500ms after click');

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'sidebar-scroll-7-final.png', fullPage: true });
  console.log('Screenshot 7: Final state (1000ms after click)');

  // Check current scroll position
  const finalScroll = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return sidebar ? sidebar.scrollTop : -1;
  });
  console.log(`\nFinal sidebar scroll position: ${finalScroll}px`);

  console.log('\n=== SCREENSHOTS SAVED ===');
  console.log('Check the following files:');
  console.log('  - sidebar-scroll-1-initial.png');
  console.log('  - sidebar-scroll-2-scrolled.png');
  console.log('  - sidebar-scroll-3-after-wait.png');
  console.log('  - sidebar-scroll-4-nav-100ms.png');
  console.log('  - sidebar-scroll-5-nav-300ms.png');
  console.log('  - sidebar-scroll-6-nav-500ms.png');
  console.log('  - sidebar-scroll-7-final.png');
});
