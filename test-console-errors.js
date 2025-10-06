const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('[Page Error]:', error.message);
    console.log(error.stack);
  });

  console.log('=== Navigating to page ===\n');

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');

  console.log('\n=== Waiting for errors to appear ===\n');
  await page.waitForTimeout(5000);

  console.log('\n=== Keeping browser open for 30 seconds ===');
  await page.waitForTimeout(30000);

  await browser.close();
})();
