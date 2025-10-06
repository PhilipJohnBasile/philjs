const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening page...\n');

  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log('❌ CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('❌ PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:3000/docs/introduction');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'simple-test.png', fullPage: true });
  console.log('Screenshot saved: simple-test.png\n');

  console.log('Keeping browser open for 60 seconds...\n');
  await page.waitForTimeout(60000);

  await browser.close();
})();
