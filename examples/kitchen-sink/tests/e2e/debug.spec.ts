import { test, expect } from '@playwright/test';

test.describe('Debug', () => {
  test('should check for console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
    });

    page.on('pageerror', error => {
      const text = `PAGE ERROR: ${error.message}`;
      errors.push(text);
      console.error(text);
    });

    await page.goto('/');

    // Wait a bit for any rendering to happen
    await page.waitForTimeout(2000);

    // Check what's in the DOM
    const rootHTML = await page.locator('#root').innerHTML();
    console.log('Root HTML:', rootHTML);

    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body HTML:', bodyHTML);

    // Print all messages and errors
    console.log('\nAll console messages:', consoleMessages);
    console.log('\nAll errors:', errors);

    // Fail the test if there are errors
    if (errors.length > 0) {
      throw new Error(`Page errors detected:\n${errors.join('\n')}`);
    }
  });
});
