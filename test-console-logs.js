const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Capturing Console Logs ===\n');

  const logs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log('CONSOLE:', text);
  });

  await page.goto('http://localhost:3000/docs/introduction');
  await page.waitForTimeout(5000);

  console.log('\n=== All Console Logs ===');
  logs.forEach((log, i) => {
    console.log(`${i + 1}. ${log}`);
  });

  console.log('\n=== Checking for playground elements ===');
  const check = await page.evaluate(() => {
    return {
      placeholders: document.querySelectorAll('.code-playground-placeholder').length,
      playgrounds: document.querySelectorAll('.code-playground').length,
      codeBlocks: document.querySelectorAll('.code-block').length,
      markdownContent: document.getElementById('markdown-content')?.innerHTML.substring(0, 500),
    };
  });

  console.log('Placeholders:', check.placeholders);
  console.log('Playgrounds:', check.playgrounds);
  console.log('Code blocks:', check.codeBlocks);
  console.log('Content preview:', check.markdownContent);

  await page.screenshot({ path: 'console-logs.png', fullPage: true });
  
  console.log('\nBrowser staying open for 30 seconds...\n');
  await page.waitForTimeout(30000);

  await browser.close();
})();
