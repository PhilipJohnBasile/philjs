const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing scroll fix...\n');

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');

  // Wait a bit for any animations
  await page.waitForTimeout(500);

  console.log('=== Initial State ===');
  const initialState = await page.evaluate(() => ({
    windowScrollY: window.scrollY,
    documentScrollHeight: document.documentElement.scrollHeight,
    windowInnerHeight: window.innerHeight,
  }));
  console.log(initialState);

  // Try scrolling with window.scrollTo
  console.log('\n=== Testing window.scrollTo(0, 500) ===');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(100);

  const afterWindowScroll = await page.evaluate(() => ({
    windowScrollY: window.scrollY,
  }));
  console.log('After window.scrollTo:', afterWindowScroll);

  if (afterWindowScroll.windowScrollY > 0) {
    console.log('✅ SUCCESS: Window scrolling works!');
  } else {
    console.log('❌ FAILED: Window scrolling still not working');
  }

  // Try scrolling with page methods
  console.log('\n=== Testing mouse wheel scroll ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);

  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(200);

  const afterMouseWheel = await page.evaluate(() => ({
    windowScrollY: window.scrollY,
  }));
  console.log('After mouse wheel:', afterMouseWheel);

  if (afterMouseWheel.windowScrollY > 0) {
    console.log('✅ SUCCESS: Mouse wheel scrolling works!');
  } else {
    console.log('❌ FAILED: Mouse wheel scrolling not working');
  }

  // Test scrolling to an element
  console.log('\n=== Testing scroll to element ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);

  const hasH2 = await page.evaluate(() => {
    const h2 = document.querySelector('h2');
    if (h2) {
      h2.scrollIntoView({ behavior: 'smooth' });
      return true;
    }
    return false;
  });

  if (hasH2) {
    await page.waitForTimeout(500);
    const afterScrollIntoView = await page.evaluate(() => ({
      windowScrollY: window.scrollY,
    }));
    console.log('After scrollIntoView:', afterScrollIntoView);

    if (afterScrollIntoView.windowScrollY > 0) {
      console.log('✅ SUCCESS: scrollIntoView works!');
    } else {
      console.log('❌ FAILED: scrollIntoView not working');
    }
  }

  // Check if page is scrollable at all
  console.log('\n=== Final Check ===');
  const finalCheck = await page.evaluate(() => {
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
    return {
      isScrollable: maxScrollY > 0,
      maxScrollY,
      routerContainerHeight: document.getElementById('router-container')?.style.minHeight || 'none',
    };
  });
  console.log(finalCheck);

  console.log('\n=== Browser will stay open for 20 seconds for manual testing ===');
  console.log('Try scrolling with your mouse or trackpad...');
  await page.waitForTimeout(20000);

  await browser.close();
})();
