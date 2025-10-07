const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[Browser ${type}]`, msg.text());
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log('[Page Error]', error.message);
  });

  console.log('Navigating to http://localhost:3001/examples');
  await page.goto('http://localhost:3001/examples', { waitUntil: 'networkidle' });

  console.log('\n--- Waiting 5 seconds to capture errors ---');
  await page.waitForTimeout(5000);

  const html = await page.content();
  console.log('\n--- HTML Length:', html.length, 'chars ---');

  await browser.close();
})();
