const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('pageerror', error => console.log('[PAGE ERROR]', error.message));

  await page.goto('http://localhost:3001/examples');

  console.log('Waiting 3 seconds for page to load...');
  await page.waitForTimeout(3000);

  const routerHTML = await page.evaluate(() => {
    const router = document.getElementById('router-container');
    return router ? router.innerHTML : 'NO ROUTER';
  });

  if (routerHTML.length === 0) {
    console.log('❌ Page failed to render!');
    await browser.close();
    return;
  }

  console.log(`✅ Page rendered successfully (${routerHTML.length} chars)`);

  // Test all 5 example buttons
  const examples = ['Counter', 'Todo List', 'Data Fetching', 'Forms', 'Animations'];

  for (const exampleName of examples) {
    console.log(`\n--- Testing: ${exampleName} ---`);

    // Find and click button
    const button = await page.getByText(exampleName, { exact: true }).first();
    await button.click();
    await page.waitForTimeout(500);

    // Check if h2 exists with the example title
    const h2 = await page.locator('h2').first();
    const h2Text = await h2.textContent();
    console.log(`Title: "${h2Text}"`);

    // Check if code blocks are visible
    const codeBlocks = await page.$$('pre');
    console.log(`Code blocks visible: ${codeBlocks.length}`);

    if (codeBlocks.length >= 2) {
      console.log(`✅ ${exampleName} works!`);
    } else {
      console.log(`❌ ${exampleName} missing code blocks`);
    }
  }

  console.log('\n--- All tests complete ---');
  await page.waitForTimeout(2000);
  await browser.close();
})();
