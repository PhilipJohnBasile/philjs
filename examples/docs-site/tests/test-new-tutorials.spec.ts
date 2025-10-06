import { test, expect } from '@playwright/test';

test('verify new tutorial pages load correctly', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING NEW TUTORIAL PAGES ===');

  // Navigate to docs homepage
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Check for Tutorial: Demo App link in sidebar
  console.log('\n--- Checking for Demo App tutorial link ---');
  const demoAppLink = page.locator('text="Tutorial: Demo App"');
  await expect(demoAppLink).toBeVisible();
  console.log('✅ Demo App link is visible');

  // Click Demo App tutorial link
  await demoAppLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Verify Demo App page loaded
  const demoAppHeading = page.locator('h1', { hasText: 'Tutorial: Build a Demo App' });
  await expect(demoAppHeading).toBeVisible();
  console.log('✅ Demo App tutorial page loaded successfully');

  // Verify content is rendered
  const demoAppContent = await page.locator('body').textContent();
  expect(demoAppContent).toContain('Fine-grained reactivity with signals');
  expect(demoAppContent).toContain('Counter');
  expect(demoAppContent).toContain('DataFetcher');
  expect(demoAppContent).toContain('AnimationDemo');
  console.log('✅ Demo App tutorial content is correct');

  // Navigate back to docs
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Check for Tutorial: Storefront link in sidebar
  console.log('\n--- Checking for Storefront tutorial link ---');
  const storefrontLink = page.locator('text="Tutorial: Storefront"');
  await expect(storefrontLink).toBeVisible();
  console.log('✅ Storefront link is visible');

  // Click Storefront tutorial link
  await storefrontLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Verify Storefront page loaded
  const storefrontHeading = page.locator('h1', { hasText: 'Tutorial: Build a Storefront with SSR' });
  await expect(storefrontHeading).toBeVisible();
  console.log('✅ Storefront tutorial page loaded successfully');

  // Verify content is rendered
  const storefrontContent = await page.locator('body').textContent();
  expect(storefrontContent).toContain('Server-side rendering (SSR) with streaming');
  expect(storefrontContent).toContain('Islands architecture');
  expect(storefrontContent).toContain('Loaders and actions');
  expect(storefrontContent).toContain('AI integration');
  console.log('✅ Storefront tutorial content is correct');

  console.log('\n=== ALL TESTS PASSED ===');
});
