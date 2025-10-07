const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('pageerror', error => console.log('[PAGE ERROR]', error.message));

  await page.goto('http://localhost:3001/examples');

  console.log('Waiting 3 seconds...');
  await page.waitForTimeout(3000);

  const routerHTML = await page.evaluate(() => {
    const router = document.getElementById('router-container');
    return router ? router.innerHTML : 'NO ROUTER';
  });

  console.log('\nRouter HTML length:', routerHTML.length);
  console.log('First 500 chars:', routerHTML.substring(0, 500));

  if (routerHTML.length > 0) {
    console.log('\n✅ Fragment syntax WORKS! Page is rendering.');

    // Test button interaction
    const buttons = await page.$$('button');
    console.log(`\nFound ${buttons.length} buttons`);

    if (buttons.length >= 2) {
      console.log('Clicking Todo button...');
      await buttons[1].click();
      await page.waitForTimeout(1000);

      const newHTML = await page.evaluate(() => {
        const router = document.getElementById('router-container');
        return router ? router.innerHTML : '';
      });

      console.log('After clicking Todo, HTML includes "Todo Example":', newHTML.includes('Todo Example'));
    }
  } else {
    console.log('\n❌ Fragment syntax BROKEN. Page not rendering.');
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
