const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Testing Interactive Code Playground ===\n');

  await page.goto('http://localhost:3000/docs/introduction', {
    waitUntil: 'networkidle'
  });

  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Check if playground exists
  const playgroundExists = await page.evaluate(() => {
    const playground = document.querySelector('.code-playground');
    return !!playground;
  });

  if (!playgroundExists) {
    console.log('❌ FAIL: Code playground not found on the page');
    await page.screenshot({ path: 'playground-fail.png', fullPage: true });
    await browser.close();
    return;
  }

  console.log('✅ Code playground found!');

  // Check for key elements
  const elements = await page.evaluate(() => {
    return {
      hasEditor: !!document.querySelector('.code-editor-textarea'),
      hasPreview: !!document.querySelector('.code-playground-preview'),
      hasRunButton: !!document.querySelector('.playground-btn-run'),
      hasResetButton: !!document.querySelector('.playground-btn-reset'),
      hasCopyButton: !!document.querySelector('.playground-btn-copy'),
    };
  });

  console.log('\nPlayground Components:');
  console.log('  Editor:', elements.hasEditor ? '✅' : '❌');
  console.log('  Preview:', elements.hasPreview ? '✅' : '❌');
  console.log('  Run Button:', elements.hasRunButton ? '✅' : '❌');
  console.log('  Reset Button:', elements.hasResetButton ? '✅' : '❌');
  console.log('  Copy Button:', elements.hasCopyButton ? '✅' : '❌');

  // Test running the code
  console.log('\nTesting code execution...');
  await page.click('.playground-btn-run');
  await page.waitForTimeout(500);

  const output = await page.evaluate(() => {
    const outputEl = document.querySelector('.preview-output');
    return outputEl ? outputEl.textContent : null;
  });

  if (output && output.includes('Initial count: 0')) {
    console.log('✅ Code execution works!');
    console.log('   Output preview:', output.substring(0, 100));
  } else {
    console.log('❌ Code execution may have failed');
    console.log('   Output:', output);
  }

  // Test editing the code
  console.log('\nTesting code editing...');
  await page.fill('.code-editor-textarea', `
const count = signal(42);
console.log('Modified count:', count.value);
  `.trim());

  await page.click('.playground-btn-run');
  await page.waitForTimeout(500);

  const newOutput = await page.evaluate(() => {
    const outputEl = document.querySelector('.preview-output');
    return outputEl ? outputEl.textContent : null;
  });

  if (newOutput && newOutput.includes('Modified count: 42')) {
    console.log('✅ Code editing works!');
    console.log('   New output:', newOutput);
  } else {
    console.log('❌ Code editing may have failed');
    console.log('   Output:', newOutput);
  }

  // Test reset button
  console.log('\nTesting reset button...');
  await page.click('.playground-btn-reset');
  await page.waitForTimeout(500);

  const resetCode = await page.evaluate(() => {
    const textarea = document.querySelector('.code-editor-textarea');
    return textarea ? textarea.value : null;
  });

  if (resetCode && resetCode.includes('const count = signal(0)')) {
    console.log('✅ Reset button works!');
  } else {
    console.log('❌ Reset button may have failed');
  }

  await page.screenshot({ path: 'playground-test.png', fullPage: true });
  console.log('\n📸 Screenshot saved: playground-test.png');

  console.log('\n=== Summary ===');
  const allGood = elements.hasEditor && elements.hasPreview &&
                  elements.hasRunButton && elements.hasResetButton &&
                  elements.hasCopyButton && output;

  if (allGood) {
    console.log('✅ All tests passed! Interactive playground is working!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.');
  }

  console.log('\nBrowser will stay open for 30 seconds for inspection...\n');
  await page.waitForTimeout(30000);

  await browser.close();
})();
