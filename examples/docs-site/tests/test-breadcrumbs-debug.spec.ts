import { test, expect } from '@playwright/test';

test('debug breadcrumb section click', async ({ page }) => {
  // Inject debugging code
  await page.addInitScript(() => {
    // Override navigate function to log calls
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      console.log('[NAVIGATE] pushState called with:', args);
      return originalPushState.apply(window.history, args);
    };
  });

  page.on('console', msg => {
    const text = msg.text();
    console.log(`[BROWSER]: ${text}`);
  });
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== DEBUGGING SECTION BREADCRUMB CLICK ===');

  // Navigate to tutorial page
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log(`\nInitial URL: ${page.url()}`);

  // Click the Getting Started button
  console.log('\n--- Clicking "Getting Started" breadcrumb ---');
  const sectionButton = page.locator('button').filter({ hasText: 'Getting Started' }).first();

  // Log button details
  const buttonText = await sectionButton.textContent();
  const buttonCount = await page.locator('button').filter({ hasText: 'Getting Started' }).count();
  console.log(`Found ${buttonCount} buttons with "Getting Started"`);
  console.log(`First button text: "${buttonText}"`);

  // Click and wait
  await sectionButton.click();
  console.log('Button clicked, waiting...');
  await page.waitForTimeout(2000);

  console.log(`\nURL after click: ${page.url()}`);

  // Check if anything changed
  const bodyContent = await page.locator('body').textContent();
  const hasIntroduction = bodyContent?.includes('Introduction');
  const hasDemoApp = bodyContent?.includes('Tutorial: Build a Demo App');

  console.log(`\nPage content check:`);
  console.log(`  Has "Introduction": ${hasIntroduction}`);
  console.log(`  Has "Tutorial: Build a Demo App": ${hasDemoApp}`);

  // Try to detect the issue
  if (page.url().includes('tutorial-demo-app')) {
    console.log('\n❌ ISSUE: URL did not change - navigation failed');
    console.log('Expected URL to change to: /docs/getting-started or /docs/getting-started/introduction');
    console.log(`Actual URL: ${page.url()}`);
  }
});
