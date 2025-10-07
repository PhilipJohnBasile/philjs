import { test, expect } from '@playwright/test';

test.describe('Forms & Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-test="nav-forms"]');
  });

  test('should handle controlled inputs', async ({ page }) => {
    // Text input
    const textInput = page.locator('[data-test="controlled-text"]');
    const textValue = page.locator('[data-test="text-value"]');
    await textInput.fill('Hello World');
    await expect(textValue).toHaveText('Hello World');

    // Number input
    const numberInput = page.locator('[data-test="controlled-number"]');
    const numberValue = page.locator('[data-test="number-value"]');
    await numberInput.fill('42');
    await expect(numberValue).toHaveText('42');

    // Checkbox
    const checkbox = page.locator('[data-test="controlled-checkbox"]');
    const checkboxValue = page.locator('[data-test="checkbox-value"]');
    await expect(checkboxValue).toHaveText('false');
    await checkbox.click();
    await expect(checkboxValue).toHaveText('true');

    // Radio
    await page.click('[data-test="controlled-radio-blue"]');
    const radioValue = page.locator('[data-test="radio-value"]');
    await expect(radioValue).toHaveText('blue');

    // Select
    const select = page.locator('[data-test="controlled-select"]');
    const selectValue = page.locator('[data-test="select-value"]');
    await select.selectOption('banana');
    await expect(selectValue).toHaveText('banana');
  });

  test('should validate email', async ({ page }) => {
    const emailInput = page.locator('[data-test="validation-email"]');
    const emailError = page.locator('[data-test="email-error"]');
    const submitButton = page.locator('[data-test="validation-submit"]');

    // Empty email
    await submitButton.click();
    await expect(emailError).toHaveText('Email is required');

    // Invalid email
    await emailInput.fill('invalid');
    await submitButton.click();
    await expect(emailError).toHaveText('Please enter a valid email');

    // Valid email
    await emailInput.fill('test@example.com');
    await expect(emailError).toBeEmpty();
  });

  test('should validate password', async ({ page }) => {
    const passwordInput = page.locator('[data-test="validation-password"]');
    const passwordError = page.locator('[data-test="password-error"]');
    const submitButton = page.locator('[data-test="validation-submit"]');

    // Too short password
    await passwordInput.fill('short');
    await submitButton.click();
    await expect(passwordError).toHaveText('Password must be at least 8 characters');

    // Valid password
    await passwordInput.fill('longpassword');
    await expect(passwordError).toBeEmpty();
  });

  test('should validate age', async ({ page }) => {
    const ageInput = page.locator('[data-test="validation-age"]');
    const ageError = page.locator('[data-test="age-error"]');
    const submitButton = page.locator('[data-test="validation-submit"]');

    // Too young
    await ageInput.fill('15');
    await submitButton.click();
    await expect(ageError).toHaveText('You must be at least 18 years old');

    // Valid age
    await ageInput.fill('25');
    await expect(ageError).toBeEmpty();
  });

  test('should complete multi-step form', async ({ page }) => {
    const step1Next = page.locator('[data-test="step1-next"]');
    const step2Next = page.locator('[data-test="step2-next"]');
    const step3Next = page.locator('[data-test="step3-next"]');
    const progress = page.locator('[data-test="form-progress"]');

    // Step 1
    await expect(page.locator('[data-test="multistep-form"]')).toContainText('Personal Information');
    await expect(progress).toHaveText('Step 1 of 3');

    await page.locator('[data-test="multi-name"]').fill('John Doe');
    await page.locator('[data-test="multi-email"]').fill('john@example.com');
    await step1Next.click();

    // Step 2
    await expect(page.locator('[data-test="multistep-form"]')).toContainText('Address');
    await expect(progress).toHaveText('Step 2 of 3');

    await page.locator('[data-test="multi-address"]').fill('123 Main St');
    await page.locator('[data-test="multi-city"]').fill('Springfield');
    await step2Next.click();

    // Step 3
    await expect(page.locator('[data-test="multistep-form"]')).toContainText('Preferences');
    await expect(progress).toHaveText('Step 3 of 3');

    await page.click('[data-test="multi-newsletter"]');
    await step3Next.click();

    // Success message
    await expect(page.locator('[data-test="form-success"]')).toBeVisible();
    await expect(page.locator('[data-test="form-success"]')).toContainText('successfully submitted');
  });

  test('should navigate back in multi-step form', async ({ page }) => {
    // Go to step 2
    await page.locator('[data-test="multi-name"]').fill('John');
    await page.locator('[data-test="multi-email"]').fill('john@test.com');
    await page.click('[data-test="step1-next"]');

    // Navigate back
    await page.click('[data-test="step2-back"]');
    await expect(page.locator('[data-test="form-progress"]')).toHaveText('Step 1 of 3');

    // Values should be preserved
    await expect(page.locator('[data-test="multi-name"]')).toHaveValue('John');
  });
});
