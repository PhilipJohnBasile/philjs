const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3001/examples');
  await page.goto('http://localhost:3001/examples');

  await page.waitForTimeout(2000);

  // Test clicking each button
  const buttons = ['Counter', 'Todo List', 'Data Fetching', 'Forms', 'Animations'];

  for (const buttonText of buttons) {
    console.log(`\nClicking "${buttonText}" button...`);

    // Find and click the button
    const button = await page.getByText(buttonText, { exact: true }).first();
    await button.click();

    await page.waitForTimeout(1000);

    // Get the current example title
    const title = await page.locator('h2').first().textContent();
    console.log(`Current title: ${title}`);

    // Check if the button has the active class/style
    const buttonStyle = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log(`Button background color: ${buttonStyle}`);
  }

  console.log('\n--- Test Complete ---');

  await page.waitForTimeout(3000);
  await browser.close();
})();
