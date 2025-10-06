import { test, expect } from '@playwright/test';

test('test breadcrumb parent links', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING BREADCRUMB LINKS ===');

  // Navigate to a deep docs page
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n--- Current page ---');
  const url = page.url();
  console.log(`URL: ${url}`);

  // Check breadcrumbs are visible
  const breadcrumbs = page.locator('.breadcrumbs, [class*="breadcrumb"]').first();
  console.log('\n--- Looking for breadcrumbs ---');

  // List all text content in breadcrumb area
  const bodyText = await page.locator('body').textContent();
  console.log('First 500 chars of page:', bodyText?.substring(0, 500));

  // Look for "Home" link
  console.log('\n--- Looking for Home link ---');
  const homeLinks = await page.locator('text="Home"').all();
  console.log(`Found ${homeLinks.length} elements with "Home" text`);

  for (let i = 0; i < homeLinks.length; i++) {
    const link = homeLinks[i];
    const tagName = await link.evaluate(el => el.tagName);
    const href = await link.evaluate(el => el.getAttribute('href'));
    const isClickable = await link.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.cursor === 'pointer' || el.tagName === 'A' || el.onclick !== null;
    });
    console.log(`  [${i}] ${tagName}, href="${href}", clickable=${isClickable}`);
  }

  // Look for section link
  console.log('\n--- Looking for Getting Started link ---');
  const sectionLinks = await page.locator('text="Getting Started"').all();
  console.log(`Found ${sectionLinks.length} elements with "Getting Started" text`);

  for (let i = 0; i < sectionLinks.length; i++) {
    const link = sectionLinks[i];
    const tagName = await link.evaluate(el => el.tagName);
    const href = await link.evaluate(el => el.getAttribute('href'));
    const isClickable = await link.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.cursor === 'pointer' || el.tagName === 'A' || el.onclick !== null;
    });
    console.log(`  [${i}] ${tagName}, href="${href}", clickable=${isClickable}`);
  }

  // Try clicking if we find a clickable home link
  console.log('\n--- Attempting to click Home link ---');
  const clickableHomeLink = page.locator('a[href="/"]').first();
  const homeExists = await clickableHomeLink.count();
  console.log(`Clickable home link exists: ${homeExists > 0}`);

  if (homeExists > 0) {
    console.log('Clicking Home link...');
    await clickableHomeLink.click();
    await page.waitForTimeout(1000);

    const newUrl = page.url();
    console.log(`New URL after click: ${newUrl}`);

    if (newUrl === 'http://localhost:3000/' || newUrl === 'http://localhost:3000') {
      console.log('✅ Home link worked!');
    } else {
      console.log('❌ Home link did not navigate correctly');
    }
  } else {
    console.log('❌ No clickable home link found');
  }
});
