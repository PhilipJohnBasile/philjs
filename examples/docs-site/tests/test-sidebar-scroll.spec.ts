import { test, expect } from '@playwright/test';

test('sidebar maintains scroll position when navigating', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING SIDEBAR SCROLL PRESERVATION ===');

  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n--- Initial state ---');
  let sidebarScroll = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return sidebar ? sidebar.scrollTop : -1;
  });
  console.log(`Sidebar scroll: ${sidebarScroll}px`);

  // Scroll the sidebar down
  console.log('\n--- Scrolling sidebar down ---');
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.scrollTop = 300;
      // Dispatch scroll event to trigger the listener
      sidebar.dispatchEvent(new Event('scroll'));
    }
  });
  await page.waitForTimeout(300);

  sidebarScroll = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return sidebar ? sidebar.scrollTop : -1;
  });
  console.log(`After scroll: ${sidebarScroll}px`);

  // Navigate to a different page via sidebar
  console.log('\n--- Clicking sidebar link ---');
  const quickStartLink = page.locator('button').filter({ hasText: 'Quick Start' }).first();
  await quickStartLink.click();
  await page.waitForTimeout(800);

  // Check sidebar scroll position
  sidebarScroll = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return sidebar ? sidebar.scrollTop : -1;
  });
  console.log(`After navigation: ${sidebarScroll}px`);

  if (sidebarScroll > 250) {
    console.log('✅ Sidebar scroll position preserved!');
  } else if (sidebarScroll === 0) {
    console.log('❌ Sidebar scrolled to top (lost position)');
  } else {
    console.log(`⚠️  Sidebar at ${sidebarScroll}px (close but not exact)`);
  }

  // Test multiple navigations
  console.log('\n--- Testing multiple navigations ---');
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.scrollTop = 500;
      // Dispatch scroll event to trigger the listener
      sidebar.dispatchEvent(new Event('scroll'));
    }
  });
  await page.waitForTimeout(300);

  sidebarScroll = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return sidebar ? sidebar.scrollTop : -1;
  });
  console.log(`Scrolled sidebar to: ${sidebarScroll}px`);

  // Navigate again
  const componentLink = page.locator('button').filter({ hasText: 'Your First Component' }).first();
  await componentLink.click();
  await page.waitForTimeout(800);

  sidebarScroll = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return sidebar ? sidebar.scrollTop : -1;
  });
  console.log(`After 2nd navigation: ${sidebarScroll}px`);

  if (sidebarScroll > 450) {
    console.log('✅ Sidebar position preserved across multiple navigations');
  } else {
    console.log('❌ Sidebar position lost');
  }

  // Check main content scrolled to top
  console.log('\n--- Checking main content scroll ---');
  const windowScroll = await page.evaluate(() => window.scrollY);
  console.log(`Window scroll: ${windowScroll}px`);

  if (windowScroll < 50) {
    console.log('✅ Main content scrolled to top');
  } else {
    console.log('❌ Main content did not scroll to top');
  }

  console.log('\n=== TEST COMPLETE ===');
});
