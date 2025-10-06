const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== CSS Specificity Debugging ===\n');

  await page.goto('http://localhost:3000/docs/introduction', {
    waitUntil: 'networkidle'
  });

  await page.waitForTimeout(2000);

  // Get all CSS rules that apply to pre elements
  const cssRules = await page.evaluate(() => {
    const pre = document.querySelector('.prose pre, pre');
    if (!pre) return { error: 'No pre element found' };

    const results = {
      element: {
        className: pre.className,
        tagName: pre.tagName,
        inlineStyle: pre.getAttribute('style'),
      },
      computedBackground: window.getComputedStyle(pre).backgroundColor,
      matchingRules: [],
    };

    // Get all stylesheets
    const sheets = Array.from(document.styleSheets);

    sheets.forEach((sheet, sheetIndex) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach((rule, ruleIndex) => {
          if (rule.style && rule.selectorText) {
            // Check if this rule might apply to our pre element
            if (rule.selectorText.includes('pre') ||
                rule.selectorText.includes('.prose')) {

              // Try to see if this rule matches our element
              try {
                if (pre.matches(rule.selectorText)) {
                  const bg = rule.style.background || rule.style.backgroundColor;
                  results.matchingRules.push({
                    selector: rule.selectorText,
                    background: bg,
                    fullRule: rule.cssText.substring(0, 200),
                    sheetHref: sheet.href || 'inline',
                    sheetIndex,
                    ruleIndex,
                  });
                }
              } catch (e) {
                // Some selectors might not work with matches()
              }
            }
          }
        });
      } catch (e) {
        // CORS or other access issues
      }
    });

    return results;
  });

  if (cssRules.error) {
    console.log('Error:', cssRules.error);
    await browser.close();
    return;
  }

  console.log('Pre Element Info:');
  console.log(JSON.stringify(cssRules.element, null, 2));
  console.log('');

  console.log('Computed Background:', cssRules.computedBackground);
  console.log('');

  console.log('Matching CSS Rules (in order):');
  if (cssRules.matchingRules && cssRules.matchingRules.length > 0) {
    cssRules.matchingRules.forEach((rule, i) => {
    console.log(`\n${i + 1}. Selector: ${rule.selector}`);
    console.log(`   Background: ${rule.background || 'none'}`);
    console.log(`   Sheet: ${rule.sheetHref}`);
    console.log(`   Full: ${rule.fullRule}`);
    });
  } else {
    console.log('No matching rules found');
  }
  console.log('');

  // Check the actual CSS file content
  console.log('=== Checking CSS File Content ===\n');

  const cssFileContent = await page.evaluate(async () => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const results = [];

    for (const link of links) {
      try {
        const response = await fetch(link.href);
        const text = await response.text();

        // Check if it contains our prose pre rule
        const hasProsePre = text.includes('.prose pre');
        const matches = text.match(/\.prose pre[^{]*\{[^}]*background[^}]*\}/g);

        results.push({
          href: link.href,
          hasProsePre,
          prosePreRules: matches || [],
        });
      } catch (e) {
        results.push({
          href: link.href,
          error: e.message,
        });
      }
    }

    return results;
  });

  console.log('CSS Files:');
  cssFileContent.forEach((file, i) => {
    console.log(`\n${i + 1}. ${file.href}`);
    if (file.error) {
      console.log(`   Error: ${file.error}`);
    } else {
      console.log(`   Has .prose pre: ${file.hasProsePre}`);
      if (file.prosePreRules.length > 0) {
        console.log(`   Rules found:`);
        file.prosePreRules.forEach(rule => {
          console.log(`     ${rule.substring(0, 150)}`);
        });
      }
    }
  });
  console.log('');

  await page.screenshot({ path: 'css-specificity-debug.png', fullPage: true });
  console.log('Screenshot saved: css-specificity-debug.png\n');

  console.log('=== Browser will stay open for 30 seconds ===\n');
  await page.waitForTimeout(30000);

  await browser.close();
})();
