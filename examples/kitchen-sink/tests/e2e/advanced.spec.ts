import { test, expect } from '@playwright/test';

test.describe('Advanced Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-test="nav-advanced"]');
  });

  test('should use composed components', async ({ page }) => {
    const count = page.locator('[data-test="composition-count"]');

    await expect(count).toHaveText('0');

    await page.click('[data-test="composition-increment"]');
    await expect(count).toHaveText('1');

    await page.click('[data-test="composition-decrement"]');
    await expect(count).toHaveText('0');

    await page.click('[data-test="composition-reset"]');
    await expect(count).toHaveText('0');
  });

  test('should calculate derived state', async ({ page }) => {
    const subtotal = page.locator('[data-test="subtotal"]');
    const tax = page.locator('[data-test="tax"]');
    const total = page.locator('[data-test="total"]');
    const itemCount = page.locator('[data-test="item-count"]');

    // Initial values (2 + 1 + 3 = 6 items, $20 + $15 + $60 = $95)
    await expect(itemCount).toHaveText('6');
    await expect(subtotal).toHaveText('$95.00');
    await expect(tax).toHaveText('$9.50');
    await expect(total).toHaveText('$104.50');

    // Increase item 1 quantity
    await page.click('[data-test="increase-1"]');
    await expect(itemCount).toHaveText('7');
    await expect(subtotal).toHaveText('$105.00');
    await expect(tax).toHaveText('$10.50');
    await expect(total).toHaveText('$115.50');

    // Decrease item 1 quantity
    await page.click('[data-test="decrease-1"]');
    await expect(itemCount).toHaveText('6');
    await expect(subtotal).toHaveText('$95.00');
  });

  test('should use custom hooks', async ({ page }) => {
    const count1 = page.locator('[data-test="hook-count-1"]');
    const count2 = page.locator('[data-test="hook-count-2"]');

    // Counter 1 starts at 0
    await expect(count1).toHaveText('0');

    // Counter 2 starts at 10
    await expect(count2).toHaveText('10');

    // Increment counter 1
    await page.click('[data-test="hook-inc-1"]');
    await expect(count1).toHaveText('1');
    await expect(count2).toHaveText('10'); // Counter 2 unchanged

    // Decrement counter 2
    await page.click('[data-test="hook-dec-2"]');
    await expect(count2).toHaveText('9');
    await expect(count1).toHaveText('1'); // Counter 1 unchanged

    // Reset counter 1
    await page.click('[data-test="hook-reset-1"]');
    await expect(count1).toHaveText('0');
  });

  test('should optimize performance with memos', async ({ page }) => {
    const computationCount = page.locator('[data-test="perf-count"]');
    const size = page.locator('[data-test="perf-size"]');
    const multiplier = page.locator('[data-test="perf-multiplier"]');
    const result = page.locator('[data-test="perf-result"]');

    // Get initial computation count
    const initialCount = await computationCount.textContent();
    const initialCountNum = parseInt(initialCount || '0');

    await expect(size).toHaveText('1000');
    await expect(multiplier).toHaveText('1');

    // Add numbers (batched update)
    await page.click('[data-test="perf-add"]');
    await expect(size).toHaveText('1003');

    // Only one new computation should have occurred
    const afterAddCount = await computationCount.textContent();
    expect(parseInt(afterAddCount || '0')).toBe(initialCountNum + 1);

    // Increase multiplier
    await page.click('[data-test="perf-multiply"]');
    await expect(multiplier).toHaveText('2');

    // Result should update
    const resultText = await result.textContent();
    expect(resultText).toBeTruthy();

    // Another computation should have occurred
    const afterMultiplyCount = await computationCount.textContent();
    expect(parseInt(afterMultiplyCount || '0')).toBe(initialCountNum + 2);
  });
});
