const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('[ERROR]', error.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[Console Error]', msg.text());
    }
  });

  await page.goto('http://localhost:3001/examples', { waitUntil: 'networkidle' });

  await page.waitForTimeout(3000);

  // Check what's actually in the DOM
  const rootHTML = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 500) : 'NO ROOT';
  });

  console.log('\n--- First 500 chars of #root ---');
  console.log(rootHTML);

  console.log('\n--- Total Errors:', errors.length, '---');

  await page.waitForTimeout(2000);
  await browser.close();
})();
