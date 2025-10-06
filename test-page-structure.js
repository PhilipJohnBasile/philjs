const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Testing Page Structure ===\n');

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check what's in the page
  const structure = await page.evaluate(() => {
    return {
      body: document.body.innerHTML.substring(0, 500),
      hasSidebar: !!document.querySelector('.sidebar'),
      hasAside: !!document.querySelector('aside'),
      hasRouterContainer: !!document.getElementById('router-container'),
      allDivClasses: Array.from(document.querySelectorAll('div')).map(d => d.className).filter(c => c).slice(0, 20),
    };
  });

  console.log('Page structure:', JSON.stringify(structure, null, 2));

  console.log('\n=== Keeping browser open for 30 seconds ===');
  await page.waitForTimeout(30000);

  await browser.close();
})();
