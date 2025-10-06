const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Final Code Block Test ===\n');

  await page.goto('http://localhost:3000/docs/data-fetching', {
    waitUntil: 'networkidle'
  });

  // Wait for content to actually render
  await page.waitForSelector('.prose', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Wait for a pre element
  try {
    await page.waitForSelector('.prose pre', { timeout: 5000 });
  } catch (e) {
    console.log('ERROR: No pre element found after waiting');
    await browser.close();
    return;
  }

  const result = await page.evaluate(() => {
    const pre = document.querySelector('.prose pre');
    if (!pre) return { error: 'No pre element' };

    const styles = window.getComputedStyle(pre);
    const bg = styles.backgroundColor;

    // Check if dark
    const isDark = bg.includes('rgb(30, 30, 30)') ||
                   bg.includes('rgb(26, 26, 26)') ||
                   bg.includes('#1e1e1e') ||
                   bg.includes('#1a1a1a');

    return {
      background: bg,
      border: styles.border,
      isDark,
      html: pre.innerHTML.substring(0, 100),
    };
  });

  console.log('Code Block Background:', result.background);
  console.log('Code Block Border:', result.border);
  console.log('Is Dark:', result.isDark ? '✅ YES' : '❌ NO');
  console.log('');

  if (result.isDark) {
    console.log('✅ SUCCESS: Code blocks are displaying with dark background!');
  } else {
    console.log('❌ FAIL: Code blocks are not dark');
    console.log('Expected: rgb(30, 30, 30) or similar');
    console.log('Got:', result.background);
  }

  await page.screenshot({ path: 'final-test.png', fullPage: true });
  console.log('\nScreenshot saved: final-test.png');

  console.log('\nBrowser will stay open for 30 seconds for inspection\n');
  await page.waitForTimeout(30000);

  await browser.close();
})();
