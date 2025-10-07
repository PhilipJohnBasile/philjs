import { test, expect } from '@playwright/test';

test.describe('Async & Data Fetching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-test="nav-async"]');
  });

  test('should fetch user data', async ({ page }) => {
    const fetchButton = page.locator('[data-test="fetch-button"]');

    await fetchButton.click();
    await expect(fetchButton).toBeDisabled();
    await expect(fetchButton).toHaveText('Loading...');

    // Wait for data to load
    await expect(page.locator('[data-test="fetch-data"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-test="fetch-data"]')).toContainText('Leanne Graham');
  });

  test('should load users with loading state', async ({ page }) => {
    const loadButton = page.locator('[data-test="load-users"]');

    await loadButton.click();

    // Loading indicator should appear
    await expect(page.locator('[data-test="loading-indicator"]')).toBeVisible();

    // Users should load
    await expect(page.locator('[data-test="users-list"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-test="user-1"]')).toBeVisible();
  });

  test('should handle success and error states', async ({ page }) => {
    // Test success
    await page.click('[data-test="simulate-success"]');
    await expect(page.locator('[data-test="processing"]')).toBeVisible();
    await expect(page.locator('[data-test="success-result"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('[data-test="success-result"]')).toContainText('completed successfully');

    // Test error
    await page.click('[data-test="simulate-error"]');
    await expect(page.locator('[data-test="processing"]')).toBeVisible();
    await expect(page.locator('[data-test="error-result"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('[data-test="error-result"]')).toContainText('Something went wrong');
  });

  test('should debounce search input', async ({ page }) => {
    const searchInput = page.locator('[data-test="search-input"]');
    const searchTerm = page.locator('[data-test="search-term"]');

    await expect(searchTerm).toHaveText('nothing');

    // Type quickly - should debounce
    await searchInput.fill('t');
    await expect(searchTerm).toHaveText('nothing'); // Too short

    await searchInput.fill('test');
    await expect(page.locator('[data-test="searching"]')).toBeVisible();

    // Wait for debounce
    await expect(searchTerm).toHaveText('test', { timeout: 1000 });
    await expect(page.locator('[data-test="search-results"]')).toBeVisible();
    await expect(page.locator('[data-test="result-0"]')).toContainText('Result for "test"');
  });
});
