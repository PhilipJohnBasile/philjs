const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Debugging Playground ===\n');

  // Enable console logging from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/docs/introduction', {
    waitUntil: 'networkidle'
  });

  await page.waitForTimeout(3000);

  // Check for placeholders
  const debug = await page.evaluate(() => {
    const results = {
      placeholders: [],
      codeBlocks: [],
      playgrounds: [],
      proseContent: '',
    };

    // Look for placeholder divs
    const placeholders = document.querySelectorAll('.code-playground-placeholder');
    placeholders.forEach((el, i) => {
      results.placeholders.push({
        id: el.id,
        innerHTML: el.innerHTML.substring(0, 100),
        hasContent: el.innerHTML.length > 0,
      });
    });

    // Look for code blocks
    const codeBlocks = document.querySelectorAll('.code-block');
    results.codeBlocks = codeBlocks.length;

    // Look for playgrounds
    const playgrounds = document.querySelectorAll('.code-playground');
    results.playgrounds = playgrounds.length;

    // Get prose content
    const prose = document.querySelector('.prose');
    if (prose) {
      results.proseContent = prose.innerHTML.substring(0, 500);
    }

    return results;
  });

  console.log('Debug Info:');
  console.log('  Placeholders found:', debug.placeholders.length);
  debug.placeholders.forEach((p, i) => {
    console.log(`    ${i + 1}. ID: ${p.id}, Has Content: ${p.hasContent}`);
    if (p.innerHTML) {
      console.log(`       Content: ${p.innerHTML}`);
    }
  });
  console.log('  Code blocks found:', debug.codeBlocks);
  console.log('  Playgrounds found:', debug.playgrounds);
  console.log('  Prose content preview:', debug.proseContent.substring(0, 200));

  await page.screenshot({ path: 'playground-debug.png', fullPage: true });
  console.log('\nScreenshot saved: playground-debug.png');

  console.log('\nBrowser will stay open for 30 seconds...\n');
  await page.waitForTimeout(30000);

  await browser.close();
})();
