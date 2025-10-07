import { test, expect } from '@playwright/test';

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Check signals demo is visible by default
  await expect(page.locator('[data-test="signals-demo"]')).toBeVisible();
  await expect(page.locator('[data-test="reactive-attributes-demo"]')).not.toBeVisible();

  // Click attributes button
  await page.click('[data-test="nav-attributes"]');

  // Check attributes demo is now visible
  await expect(page.locator('[data-test="reactive-attributes-demo"]')).toBeVisible();
  await expect(page.locator('[data-test="signals-demo"]')).not.toBeVisible();

  // Click forms button
  await page.click('[data-test="nav-forms"]');

  // Check forms demo is now visible
  await expect(page.locator('[data-test="forms-demo"]')).toBeVisible();
  await expect(page.locator('[data-test="reactive-attributes-demo"]')).not.toBeVisible();
});
