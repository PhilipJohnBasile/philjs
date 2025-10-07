const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('pageerror', error => console.log('[PAGE ERROR]', error.message));
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[${type.toUpperCase()}]`, msg.text());
    }
  });

  await page.goto('http://localhost:3001/examples');
  
  console.log('Waiting 3 seconds...');
  await page.waitForTimeout(3000);

  const screenshot = await page.screenshot();
  require('fs').writeFileSync('/Users/pjb/Git/philjs/screenshot.png', screenshot);
  console.log('Screenshot saved to screenshot.png');

  const routerHTML = await page.evaluate(() => {
    const router = document.getElementById('router-container');
    return router ? router.innerHTML : 'NO ROUTER';
  });

  console.log('\nRouter HTML length:', routerHTML.length);
  console.log('First 1000 chars:', routerHTML.substring(0, 1000));

  await page.waitForTimeout(2000);
  await browser.close();
})();
