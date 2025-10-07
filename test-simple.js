const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3001/examples');

  try {
    await page.goto('http://localhost:3001/examples', { waitUntil: 'domcontentloaded', timeout: 5000 });
    console.log('✅ Page loaded');

    // Check if buttons exist
    const buttons = await page.$$('button');
    console.log(`✅ Found ${buttons.length} buttons`);

    // Get button text
    for (let i = 0; i < Math.min(buttons.length, 8); i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: "${text}"`);
    }

    // Check for h2 elements (example titles)
    const h2s = await page.$$('h2');
    console.log(`✅ Found ${h2s.length} h2 elements`);
    if (h2s.length > 0) {
      const firstH2 = await h2s[0].textContent();
      console.log(`  First h2: "${firstH2}"`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
