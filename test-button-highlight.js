const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/examples');
  await page.waitForTimeout(2000);

  console.log('Checking initial state...');
  const counterButton = await page.locator('button:has-text("Counter")').first();
  const todoButton = await page.locator('button:has-text("Todo List")').first();

  const counterInitialBg = await counterButton.evaluate(el => getComputedStyle(el).backgroundColor);
  const todoInitialBg = await todoButton.evaluate(el => getComputedStyle(el).backgroundColor);

  console.log('Counter button bg:', counterInitialBg);
  console.log('Todo button bg:', todoInitialBg);

  console.log('\nClicking Todo button...');
  await todoButton.click();
  await page.waitForTimeout(500);

  const counterAfterBg = await counterButton.evaluate(el => getComputedStyle(el).backgroundColor);
  const todoAfterBg = await todoButton.evaluate(el => getComputedStyle(el).backgroundColor);

  console.log('\nAfter click:');
  console.log('Counter button bg:', counterAfterBg);
  console.log('Todo button bg:', todoAfterBg);

  if (counterInitialBg !== counterAfterBg && todoInitialBg !== todoAfterBg) {
    console.log('\n✅ Button highlighting IS updating!');
  } else {
    console.log('\n❌ Button highlighting NOT updating');
  }

  await browser.close();
})();
