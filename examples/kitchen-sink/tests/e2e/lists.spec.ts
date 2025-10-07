import { test, expect } from '@playwright/test';

test.describe('Lists & Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-test="nav-lists"]');
  });

  test('should add and remove items from basic list', async ({ page }) => {
    const input = page.locator('[data-test="basic-list-input"]');
    const addButton = page.locator('[data-test="basic-list-add"]');

    // Add new item
    await input.fill('Orange');
    await addButton.click();
    await expect(page.locator('[data-test="basic-list-item-3"]')).toContainText('Orange');

    // Remove item
    await page.click('[data-test="basic-list-remove-0"]');
    await expect(page.locator('[data-test="basic-list-item-0"]')).toContainText('Banana');
  });

  test('should add todos', async ({ page }) => {
    const input = page.locator('[data-test="todo-input"]');
    const addButton = page.locator('[data-test="todo-add"]');

    await input.fill('Test Todo');
    await addButton.click();

    await expect(page.locator('[data-test="todo-items"]')).toContainText('Test Todo');
  });

  test('should toggle todo completion', async ({ page }) => {
    const checkbox = page.locator('[data-test="todo-checkbox-1"]');
    const activeCount = page.locator('[data-test="active-count"]');
    const completedCount = page.locator('[data-test="completed-count"]');

    await expect(activeCount).toHaveText('3');
    await expect(completedCount).toHaveText('0');

    await checkbox.click();

    await expect(activeCount).toHaveText('2');
    await expect(completedCount).toHaveText('1');
  });

  test('should filter todos', async ({ page }) => {
    // Mark one todo as complete
    await page.click('[data-test="todo-checkbox-1"]');

    // Filter to active
    await page.click('[data-test="filter-active"]');
    await expect(page.locator('[data-test="todo-items"]')).not.toContainText('Build an app');
    await expect(page.locator('[data-test="todo-items"]')).toContainText('Learn PhilJS');

    // Filter to completed
    await page.click('[data-test="filter-completed"]');
    await expect(page.locator('[data-test="todo-items"]')).toContainText('Build an app');
    await expect(page.locator('[data-test="todo-items"]')).not.toContainText('Learn PhilJS');

    // Filter to all
    await page.click('[data-test="filter-all"]');
    await expect(page.locator('[data-test="todo-items"]')).toContainText('Build an app');
    await expect(page.locator('[data-test="todo-items"]')).toContainText('Learn PhilJS');
  });

  test('should delete todo', async ({ page }) => {
    await page.click('[data-test="todo-delete-1"]');
    await expect(page.locator('[data-test="todo-items"]')).not.toContainText('Build an app');
  });

  test('should clear completed todos', async ({ page }) => {
    // Mark todos as complete
    await page.click('[data-test="todo-checkbox-1"]');
    await page.click('[data-test="todo-checkbox-2"]');

    const clearButton = page.locator('[data-test="clear-completed"]');
    await expect(clearButton).toBeVisible();

    await clearButton.click();

    await expect(page.locator('[data-test="completed-count"]')).toHaveText('0');
    await expect(page.locator('[data-test="todo-items"]')).not.toContainText('Build an app');
  });

  test('should render conditionally based on state', async ({ page }) => {
    const showCheckbox = page.locator('[data-test="show-content"]');

    await expect(page.locator('[data-test="content-visible"]')).toBeVisible();
    await expect(page.locator('[data-test="content-hidden"]')).not.toBeVisible();

    await showCheckbox.click();

    await expect(page.locator('[data-test="content-visible"]')).not.toBeVisible();
    await expect(page.locator('[data-test="content-hidden"]')).toBeVisible();
  });

  test('should show role-specific content', async ({ page }) => {
    const roleContent = page.locator('[data-test="role-content"]');

    // Guest
    await expect(roleContent).toContainText('Welcome, guest');

    // User
    await page.click('[data-test="role-user"]');
    await expect(roleContent).toContainText('user access');

    // Admin
    await page.click('[data-test="role-admin"]');
    await expect(roleContent).toContainText('admin privileges');
  });

  test('should toggle fragments', async ({ page }) => {
    const toggleButton = page.locator('[data-test="toggle-fragments"]');

    await expect(toggleButton).toContainText('Hide');
    await expect(page.locator('[data-test="fragments"]')).toContainText('Fragment Example');

    await toggleButton.click();
    await expect(toggleButton).toContainText('Show');
    await expect(page.locator('[data-test="fragments"]')).not.toContainText('Fragment Example');
  });
});
