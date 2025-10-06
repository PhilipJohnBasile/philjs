import { test } from '@playwright/test';

test('test all clickable elements on homepage', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== LOADING HOMEPAGE ===');
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n=== FINDING ALL CLICKABLE ELEMENTS ===');

  // Find all buttons and links
  const buttons = await page.locator('button').all();
  const links = await page.locator('a').all();

  console.log(`Found ${buttons.length} buttons and ${links.length} links`);

  // Test each button
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    console.log(`\n--- Button ${i + 1}: "${text?.substring(0, 50)}" ---`);

    try {
      await button.click();
      await page.waitForTimeout(1000);

      const currentURL = page.url();
      console.log(`After click: ${currentURL}`);

      // Check if page changed
      const bodyText = await page.locator('body').textContent();
      console.log(`Body text length: ${bodyText?.length}`);
      console.log(`First 100 chars: ${bodyText?.substring(0, 100)}`);

      // Navigate back to homepage for next test
      await page.goto('http://localhost:3000/');
      await page.waitForTimeout(500);
    } catch (error) {
      console.error(`Error clicking button: ${error}`);
    }
  }

  // Test each link
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`\n--- Link ${i + 1}: "${text?.substring(0, 50)}" (href: ${href}) ---`);

    try {
      await link.click();
      await page.waitForTimeout(1000);

      const currentURL = page.url();
      console.log(`After click: ${currentURL}`);

      const bodyText = await page.locator('body').textContent();
      console.log(`Body text length: ${bodyText?.length}`);
      console.log(`First 100 chars: ${bodyText?.substring(0, 100)}`);

      // Navigate back to homepage for next test
      await page.goto('http://localhost:3000/');
      await page.waitForTimeout(500);
    } catch (error) {
      console.error(`Error clicking link: ${error}`);
    }
  }
});
