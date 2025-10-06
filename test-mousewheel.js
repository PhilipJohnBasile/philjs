const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  console.log('=== Testing Mouse Wheel Behavior ===\n');

  // Check for event listeners that might prevent scroll
  const wheelListeners = await page.evaluate(() => {
    const events = ['wheel', 'mousewheel', 'DOMMouseScroll', 'scroll'];
    const results = {};

    events.forEach(eventName => {
      const listeners = [];
      // Can't directly enumerate listeners, but we can check if preventDefault is being called
      results[eventName] = 'Cannot enumerate listeners directly';
    });

    return results;
  });

  console.log('Event listener check:', wheelListeners);

  // Try different scroll methods
  console.log('\n=== Method 1: page.mouse.wheel ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  const afterMouseWheel = await page.evaluate(() => window.scrollY);
  console.log(`Scroll position: ${afterMouseWheel}px`);

  // Try keyboard scrolling
  console.log('\n=== Method 2: Keyboard Page Down ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(300);
  const afterPageDown = await page.evaluate(() => window.scrollY);
  console.log(`Scroll position: ${afterPageDown}px`);

  // Try keyboard arrow down
  console.log('\n=== Method 3: Keyboard Arrow Down (10 times) ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
  }
  const afterArrowDown = await page.evaluate(() => window.scrollY);
  console.log(`Scroll position: ${afterArrowDown}px`);

  // Try space bar
  console.log('\n=== Method 4: Keyboard Space ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const afterSpace = await page.evaluate(() => window.scrollY);
  console.log(`Scroll position: ${afterSpace}px`);

  console.log('\n=== Summary ===');
  console.log(`Mouse wheel: ${afterMouseWheel > 0 ? '✅' : '❌'}`);
  console.log(`Page Down: ${afterPageDown > 0 ? '✅' : '❌'}`);
  console.log(`Arrow Down: ${afterArrowDown > 0 ? '✅' : '❌'}`);
  console.log(`Space: ${afterSpace > 0 ? '✅' : '❌'}`);

  // Manual test
  console.log('\n=== Manual Test (30 seconds) ===');
  console.log('Try scrolling manually with mouse/trackpad and keyboard...');

  // Monitor scroll changes
  let lastScroll = 0;
  const interval = setInterval(async () => {
    const currentScroll = await page.evaluate(() => window.scrollY);
    if (currentScroll !== lastScroll) {
      console.log(`Scroll changed to: ${currentScroll}px`);
      lastScroll = currentScroll;
    }
  }, 500);

  await page.waitForTimeout(30000);
  clearInterval(interval);

  await browser.close();
})();
