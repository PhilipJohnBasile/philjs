import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the kitchen sink app', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('PhilJS Kitchen Sink');
    await expect(page.locator('p').first()).toContainText('Complete demonstration of all PhilJS features');
  });

  test('should navigate between sections', async ({ page }) => {
    await page.goto('/');

    // Default to signals
    await expect(page.locator('[data-test="signals-demo"]')).toBeVisible();

    // Navigate to attributes
    await page.click('[data-test="nav-attributes"]');
    await expect(page.locator('[data-test="reactive-attributes-demo"]')).toBeVisible();
    await expect(page.locator('[data-test="signals-demo"]')).not.toBeVisible();

    // Navigate to forms
    await page.click('[data-test="nav-forms"]');
    await expect(page.locator('[data-test="forms-demo"]')).toBeVisible();
    await expect(page.locator('[data-test="reactive-attributes-demo"]')).not.toBeVisible();

    // Navigate to async
    await page.click('[data-test="nav-async"]');
    await expect(page.locator('[data-test="async-demo"]')).toBeVisible();

    // Navigate to advanced
    await page.click('[data-test="nav-advanced"]');
    await expect(page.locator('[data-test="advanced-demo"]')).toBeVisible();

    // Back to signals
    await page.click('[data-test="nav-signals"]');
    await expect(page.locator('[data-test="signals-demo"]')).toBeVisible();
    await expect(page.locator('[data-test="advanced-demo"]')).not.toBeVisible();
  });

  // Note: Button highlighting test skipped - would require reactive button styles
  // which causes issues when defined in map() loops
});

