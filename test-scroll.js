const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');

  console.log('=== Page Loaded ===\n');

  // Check viewport and document dimensions
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    bodyWidth: document.body.scrollWidth,
    bodyHeight: document.body.scrollHeight,
  }));

  console.log('Dimensions:', dimensions);
  console.log('');

  // Check overflow settings on key elements
  const overflowStyles = await page.evaluate(() => {
    const elements = [
      { selector: 'html', element: document.documentElement },
      { selector: 'body', element: document.body },
      { selector: 'main', element: document.querySelector('main') },
      { selector: '.docs-container', element: document.querySelector('.docs-container') },
      { selector: '[class*="docs"]', element: document.querySelector('[class*="docs"]') },
    ];

    return elements.map(({ selector, element }) => {
      if (!element) return { selector, exists: false };

      const styles = window.getComputedStyle(element);
      return {
        selector,
        exists: true,
        className: element.className,
        overflow: styles.overflow,
        overflowX: styles.overflowX,
        overflowY: styles.overflowY,
        height: styles.height,
        maxHeight: styles.maxHeight,
        position: styles.position,
        display: styles.display,
      };
    });
  });

  console.log('=== Overflow Styles ===');
  overflowStyles.forEach(style => console.log(style));
  console.log('');

  // Check if page is scrollable
  const scrollTest = await page.evaluate(() => {
    const initialScrollY = window.scrollY;
    window.scrollTo(0, 100);
    const afterScrollY = window.scrollY;
    window.scrollTo(0, initialScrollY);

    return {
      initialScrollY,
      afterScrollY,
      canScroll: afterScrollY > initialScrollY,
      maxScrollY: document.documentElement.scrollHeight - window.innerHeight,
    };
  });

  console.log('=== Scroll Test ===');
  console.log(scrollTest);
  console.log('');

  // Find all elements with overflow hidden
  const hiddenOverflows = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const hidden = [];

    allElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      if (styles.overflow === 'hidden' || styles.overflowY === 'hidden') {
        hidden.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          id: el.id,
          overflow: styles.overflow,
          overflowY: styles.overflowY,
          height: styles.height,
        });
      }
    });

    return hidden;
  });

  console.log('=== Elements with overflow: hidden ===');
  console.log(`Found ${hiddenOverflows.length} elements`);
  hiddenOverflows.slice(0, 10).forEach(el => console.log(el));
  console.log('');

  // Check for fixed/sticky positioning that might affect scroll
  const fixedElements = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const fixed = [];

    allElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      if (styles.position === 'fixed' || styles.position === 'sticky') {
        fixed.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          position: styles.position,
          top: styles.top,
          bottom: styles.bottom,
          height: styles.height,
        });
      }
    });

    return fixed;
  });

  console.log('=== Fixed/Sticky Elements ===');
  fixedElements.forEach(el => console.log(el));
  console.log('');

  // Take a screenshot
  await page.screenshot({ path: 'scroll-debug.png', fullPage: true });
  console.log('Screenshot saved to scroll-debug.png');

  // Keep browser open for manual inspection
  console.log('\n=== Browser will stay open for 30 seconds for manual inspection ===');
  await page.waitForTimeout(30000);

  await browser.close();
})();
