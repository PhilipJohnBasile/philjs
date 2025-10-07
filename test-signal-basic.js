const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/examples');
  await page.waitForTimeout(2000);

  // Test if signal.set() works by evaluating in browser console
  const result = await page.evaluate(() => {
    // Access the signal through the window or create a test signal
    const { signal } = window.__PHILJS__ || {};

    if (!signal) {
      return { error: 'PhilJS not found on window' };
    }

    // Create a test signal
    const testSignal = signal(5);
    const before = testSignal();
    testSignal.set(10);
    const after = testSignal();

    return {
      before,
      after,
      success: before === 5 && after === 10
    };
  });

  console.log('Signal test result:', result);

  await browser.close();
})();
