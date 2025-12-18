import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads without errors', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page.locator('h1')).toContainText('PhilJS Kitchen Sink');

    // Take a screenshot
    await page.screenshot({ path: 'test-results/screenshots/homepage.png', fullPage: true });
  });

  test('page has no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check that there are no console errors
    expect(errors).toHaveLength(0);
  });
});
