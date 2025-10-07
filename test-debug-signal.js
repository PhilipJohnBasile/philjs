const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console.logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3001/examples');
  await page.waitForTimeout(3000);

  console.log('Initial state:');
  const initialDebug = await page.locator('p:has-text("DEBUG:")').textContent();
  console.log(initialDebug);

  console.log('\nClicking Todo button...');
  const todoButton = await page.getByText('Todo List', { exact: true }).first();
  await todoButton.click();
  await page.waitForTimeout(1000);

  console.log('\nConsole logs after click:');
  logs.forEach(log => console.log(log));

  console.log('\nAfter clicking Todo:');
  const afterDebug = await page.locator('p:has-text("DEBUG:")').textContent();
  console.log(afterDebug);

  if (afterDebug.includes('todo')) {
    console.log('\n✅ Signal IS updating!');
  } else {
    console.log('\n❌ Signal NOT updating');
  }

  await browser.close();
})();
