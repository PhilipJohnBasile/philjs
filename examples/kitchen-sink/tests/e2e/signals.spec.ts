import { test, expect } from '@playwright/test';

test.describe('Signals & Reactivity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-test="nav-signals"]');
  });

  test('should display basic signals example', async ({ page }) => {
    const countValue = page.locator('[data-test="count-value"]');
    await expect(countValue).toHaveText('0');

    // Test increment
    await page.click('[data-test="increment"]');
    await expect(countValue).toHaveText('1');

    await page.click('[data-test="increment"]');
    await expect(countValue).toHaveText('2');

    // Test decrement
    await page.click('[data-test="decrement"]');
    await expect(countValue).toHaveText('1');

    // Test reset
    await page.click('[data-test="reset"]');
    await expect(countValue).toHaveText('0');
  });

  test('should update name signal', async ({ page }) => {
    const nameInput = page.locator('[data-test="name-input"]');
    const nameValue = page.locator('[data-test="name-value"]');

    await expect(nameValue).toHaveText('PhilJS');

    await nameInput.fill('Test Name');
    await expect(nameValue).toHaveText('Test Name');
  });

  test('should compute memo values', async ({ page }) => {
    const firstNameInput = page.locator('[data-test="first-name"]');
    const lastNameInput = page.locator('[data-test="last-name"]');
    const fullName = page.locator('[data-test="full-name"]');
    const greeting = page.locator('[data-test="greeting"]');

    await firstNameInput.fill('Jane');
    await lastNameInput.fill('Smith');

    await expect(fullName).toHaveText('Jane Smith');
    await expect(greeting).toHaveText('Hello, Jane Smith!');
  });

  test('should calculate age-based memos', async ({ page }) => {
    const ageSlider = page.locator('[data-test="age-slider"]');
    const canVote = page.locator('[data-test="can-vote"]');
    const ageGroup = page.locator('[data-test="age-group"]');

    // Set age to 15 (minor, cannot vote)
    await ageSlider.fill('15');
    await expect(canVote).toHaveText('No');
    await expect(ageGroup).toHaveText('Minor');

    // Set age to 25 (adult, can vote)
    await ageSlider.fill('25');
    await expect(canVote).toHaveText('Yes');
    await expect(ageGroup).toHaveText('Adult');

    // Set age to 70 (senior, can vote)
    await ageSlider.fill('70');
    await expect(canVote).toHaveText('Yes');
    await expect(ageGroup).toHaveText('Senior');
  });

  test('should run effects with cleanup', async ({ page }) => {
    const toggleButton = page.locator('[data-test="toggle-effect"]');
    const counter = page.locator('[data-test="effect-counter"]');

    // Effect should be running by default
    await expect(toggleButton).toHaveText(/Stop/);

    // Wait for counter to increment
    await expect(counter).toContainText('Counter:');

    // Stop the effect
    await toggleButton.click();
    await expect(toggleButton).toHaveText(/Start/);
  });

  test('should batch updates efficiently', async ({ page }) => {
    const updateCount = page.locator('[data-test="update-count"]');
    const sum = page.locator('[data-test="batch-sum"]');

    const initialCount = await updateCount.textContent();
    const initialCountNum = parseInt(initialCount || '0');

    // Individual updates trigger multiple evaluations
    await page.click('[data-test="update-individual"]');
    const afterIndividual = await updateCount.textContent();
    expect(parseInt(afterIndividual || '0')).toBe(initialCountNum + 3);

    // Batched updates trigger single evaluation
    const beforeBatch = parseInt(afterIndividual || '0');
    await page.click('[data-test="update-batched"]');
    const afterBatch = await updateCount.textContent();
    expect(parseInt(afterBatch || '0')).toBe(beforeBatch + 1);
  });

  test('should untrack signal reads', async ({ page }) => {
    const effectCount = page.locator('[data-test="effect-count"]');
    const trackedValue = page.locator('[data-test="tracked-value"]');
    const untrackedValue = page.locator('[data-test="untracked-value"]');

    await expect(trackedValue).toHaveText('0');
    await expect(untrackedValue).toHaveText('0');
    await expect(effectCount).toHaveText('1');

    // Updating tracked signal should trigger effect
    await page.click('[data-test="update-tracked"]');
    await expect(trackedValue).toHaveText('1');
    await expect(effectCount).toHaveText('2');

    // Updating untracked signal should NOT trigger effect
    await page.click('[data-test="update-untracked"]');
    await expect(untrackedValue).toHaveText('1');
    await expect(effectCount).toHaveText('2'); // Should still be 2
  });
});
