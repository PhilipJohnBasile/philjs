import { test, expect } from '@playwright/test';

test.describe('Reactive Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-test="nav-attributes"]');
  });

  test('should update reactive styles', async ({ page }) => {
    const sizeSlider = page.locator('[data-test="style-size"]');
    const sizeValue = page.locator('[data-test="style-size-value"]');
    const box = page.locator('[data-test="style-box"]');

    // Test size change
    await sizeSlider.fill('100');
    await expect(sizeValue).toHaveText('100px');

    // Verify box has correct size
    const boxSize = await box.evaluate(el => {
      const style = window.getComputedStyle(el);
      return { width: style.width, height: style.height };
    });
    expect(boxSize.width).toBe('100px');
    expect(boxSize.height).toBe('100px');
  });

  test('should toggle circle shape', async ({ page }) => {
    const checkbox = page.locator('[data-test="style-active"]');
    const box = page.locator('[data-test="style-box"]');

    // Initially should be square (8px border radius)
    let borderRadius = await box.evaluate(el => window.getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe('8px');

    // Toggle to circle (50%)
    await checkbox.click();
    borderRadius = await box.evaluate(el => window.getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe('50%');
  });

  test('should update color', async ({ page }) => {
    const colorPicker = page.locator('[data-test="style-color"]');
    const colorValue = page.locator('[data-test="style-color-value"]');
    const box = page.locator('[data-test="style-box"]');

    await colorPicker.fill('#ff0000');
    await expect(colorValue).toHaveText('#ff0000');

    const backgroundColor = await box.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBe('rgb(255, 0, 0)');
  });

  test('should update reactive classes and styles', async ({ page }) => {
    const statusBox = page.locator('[data-test="status-box"]');

    // Test success status
    await page.click('[data-test="status-success"]');
    await expect(statusBox).toContainText('SUCCESS');
    const successBg = await statusBox.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(successBg).toBe('rgb(16, 185, 129)');

    // Test error status
    await page.click('[data-test="status-error"]');
    await expect(statusBox).toContainText('ERROR');
    const errorBg = await statusBox.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(errorBg).toBe('rgb(239, 68, 68)');
  });

  test('should update reactive attributes', async ({ page }) => {
    const input = page.locator('[data-test="reactive-input"]');
    const disabledCheckbox = page.locator('[data-test="attr-disabled"]');
    const maxLengthSlider = page.locator('[data-test="attr-maxlength"]');

    // Test disabled attribute
    await expect(input).not.toBeDisabled();
    await disabledCheckbox.click();
    await expect(input).toBeDisabled();

    // Test maxLength attribute
    await disabledCheckbox.click(); // Re-enable
    await maxLengthSlider.fill('20');
    const maxLength = await input.getAttribute('maxLength');
    expect(maxLength).toBe('20');
  });

  test('should switch themes', async ({ page }) => {
    const themeToggle = page.locator('[data-test="theme-toggle"]');
    const themeName = page.locator('[data-test="theme-name"]');
    const container = themeName.locator('xpath=ancestor::div[@style]').first();

    await expect(themeName).toHaveText('LIGHT');
    await expect(themeToggle).toContainText('Dark');

    // Switch to dark theme
    await themeToggle.click();
    await expect(themeName).toHaveText('DARK');
    await expect(themeToggle).toContainText('Light');

    const darkBg = await container.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(darkBg).toBe('rgb(26, 26, 26)');
  });
});
