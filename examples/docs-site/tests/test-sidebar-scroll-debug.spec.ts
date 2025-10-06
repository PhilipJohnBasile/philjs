import { test, expect } from '@playwright/test';

test('debug sidebar scroll in detail', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));

  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n=== STEP 1: Check initial state ===');
  const initial = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return {
      exists: !!sidebar,
      scrollTop: sidebar ? sidebar.scrollTop : -1,
      scrollHeight: sidebar ? sidebar.scrollHeight : -1,
      clientHeight: sidebar ? sidebar.clientHeight : -1,
      isScrollable: sidebar ? sidebar.scrollHeight > sidebar.clientHeight : false,
    };
  });
  console.log('Initial sidebar state:', JSON.stringify(initial, null, 2));

  console.log('\n=== STEP 2: Scroll sidebar ===');
  const afterScroll = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      console.log('[DEBUG] Before scroll, scrollTop =', sidebar.scrollTop);
      sidebar.scrollTop = 300;
      // Manually dispatch scroll event to trigger the listener
      sidebar.dispatchEvent(new Event('scroll'));
      console.log('[DEBUG] After setting, scrollTop =', sidebar.scrollTop);
    }
    return {
      scrollTop: sidebar ? sidebar.scrollTop : -1,
    };
  });
  console.log('After scroll:', JSON.stringify(afterScroll, null, 2));

  await page.waitForTimeout(500);

  console.log('\n=== STEP 3: Check scroll persisted ===');
  const confirmed = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    return {
      scrollTop: sidebar ? sidebar.scrollTop : -1,
    };
  });
  console.log('Confirmed scroll:', JSON.stringify(confirmed, null, 2));

  console.log('\n=== STEP 4: Click button (will trigger save) ===');
  const quickStartLink = page.locator('.sidebar button').filter({ hasText: 'Quick Start' }).first();
  await quickStartLink.click();

  console.log('\n=== STEP 5: Wait and check final state ===');
  await page.waitForTimeout(1000);

  const final = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    const saved = sessionStorage.getItem('sidebarScrollTop');
    return {
      scrollTop: sidebar ? sidebar.scrollTop : -1,
      sessionStorageValue: saved,
    };
  });
  console.log('Final state:', JSON.stringify(final, null, 2));
});
