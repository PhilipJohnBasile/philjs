const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/examples');
  await page.waitForTimeout(2000);

  console.log('Initial state (Counter):');
  const initialCode = await page.locator('code').first().textContent();
  console.log('First 100 chars:', initialCode.substring(0, 100));

  console.log('\nClicking Todo button...');
  const todoButton = await page.getByText('Todo List', { exact: true }).first();
  await todoButton.click();
  await page.waitForTimeout(1000);

  console.log('\nAfter clicking Todo:');
  const afterCode = await page.locator('code').first().textContent();
  console.log('First 100 chars:', afterCode.substring(0, 100));

  if (initialCode !== afterCode) {
    console.log('\n✅ Code blocks ARE updating!');
    if (afterCode.includes('todos')) {
      console.log('✅ Code correctly shows Todo example!');
    }
  } else {
    console.log('\n❌ Code blocks NOT updating (still showing same content)');
  }

  await browser.close();
})();
