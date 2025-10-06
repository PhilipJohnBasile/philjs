const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Debugging Code Block Styles ===\n');

  // Navigate with cache disabled
  await page.goto('http://localhost:3000/docs/introduction', {
    waitUntil: 'networkidle'
  });

  await page.waitForTimeout(2000);

  // Get computed styles for code blocks
  const codeBlockInfo = await page.evaluate(() => {
    const results = {};

    // Check CSS variables
    const root = document.documentElement;
    const rootStyles = getComputedStyle(root);
    results.cssVariables = {
      '--color-bg-code': rootStyles.getPropertyValue('--color-bg-code').trim(),
      '--color-code-border': rootStyles.getPropertyValue('--color-code-border').trim(),
      '--color-code-text': rootStyles.getPropertyValue('--color-code-text').trim(),
    };

    // Check actual pre element
    const pre = document.querySelector('.prose pre, pre');
    if (pre) {
      const preStyles = getComputedStyle(pre);
      results.preElement = {
        background: preStyles.backgroundColor,
        border: preStyles.border,
        boxShadow: preStyles.boxShadow,
        exists: true,
        innerHTML: pre.innerHTML.substring(0, 100),
      };

      // Check code inside pre
      const code = pre.querySelector('code');
      if (code) {
        const codeStyles = getComputedStyle(code);
        results.preCode = {
          background: codeStyles.backgroundColor,
          color: codeStyles.color,
        };
      }
    } else {
      results.preElement = { exists: false };
    }

    // Check inline code
    const inlineCode = document.querySelector('.prose code:not(pre code), code:not(pre code)');
    if (inlineCode) {
      const styles = getComputedStyle(inlineCode);
      results.inlineCode = {
        background: styles.backgroundColor,
        color: styles.color,
        border: styles.border,
        exists: true,
      };
    } else {
      results.inlineCode = { exists: false };
    }

    // Check loaded stylesheets
    results.stylesheets = Array.from(document.styleSheets).map(sheet => {
      try {
        return {
          href: sheet.href,
          rules: sheet.cssRules ? sheet.cssRules.length : 0,
        };
      } catch (e) {
        return { href: sheet.href, error: 'Cannot access' };
      }
    });

    return results;
  });

  console.log('CSS Variables:');
  console.log(JSON.stringify(codeBlockInfo.cssVariables, null, 2));
  console.log('');

  console.log('Pre Element:');
  console.log(JSON.stringify(codeBlockInfo.preElement, null, 2));
  console.log('');

  console.log('Pre Code:');
  console.log(JSON.stringify(codeBlockInfo.preCode, null, 2));
  console.log('');

  console.log('Inline Code:');
  console.log(JSON.stringify(codeBlockInfo.inlineCode, null, 2));
  console.log('');

  console.log('Loaded Stylesheets:');
  codeBlockInfo.stylesheets.forEach((sheet, i) => {
    console.log(`  ${i + 1}. ${sheet.href || 'inline'} (${sheet.rules || sheet.error} rules)`);
  });
  console.log('');

  // Check what the CSS actually contains
  const cssContent = await page.evaluate(() => {
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    const results = [];

    styleElements.forEach((el, i) => {
      if (el.tagName === 'STYLE') {
        const content = el.textContent || '';
        const hasCodeBg = content.includes('--color-bg-code');
        const hasProsePre = content.includes('.prose pre');
        results.push({
          type: 'inline-style',
          index: i,
          hasCodeBg,
          hasProsePre,
          preview: content.substring(0, 200),
        });
      } else if (el.tagName === 'LINK') {
        results.push({
          type: 'link',
          href: el.href,
        });
      }
    });

    return results;
  });

  console.log('Style Elements:');
  cssContent.forEach((item, i) => {
    if (item.type === 'inline-style') {
      console.log(`  Inline ${i}: hasCodeBg=${item.hasCodeBg}, hasProsePre=${item.hasProsePre}`);
      console.log(`    Preview: ${item.preview.substring(0, 100)}`);
    } else {
      console.log(`  Link: ${item.href}`);
    }
  });
  console.log('');

  // Force reload and check again
  console.log('Performing hard reload...\n');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const afterReload = await page.evaluate(() => {
    const pre = document.querySelector('.prose pre, pre');
    if (pre) {
      const preStyles = getComputedStyle(pre);
      return {
        background: preStyles.backgroundColor,
        computed: preStyles.background,
      };
    }
    return null;
  });

  console.log('After Reload:');
  console.log(JSON.stringify(afterReload, null, 2));
  console.log('');

  // Check if it's #1e1e1e
  const isDark = afterReload && (
    afterReload.background.includes('rgb(30, 30, 30)') ||
    afterReload.background.includes('#1e1e1e')
  );

  console.log(`\n=== Result: Code blocks are ${isDark ? '✅ DARK' : '❌ NOT DARK'} ===\n`);

  if (!isDark) {
    console.log('Expected: rgb(30, 30, 30) or #1e1e1e');
    console.log(`Actual: ${afterReload?.background || 'N/A'}`);
    console.log('');
    console.log('This suggests the CSS is not loading correctly.');
  }

  await page.screenshot({ path: 'code-blocks-debug.png', fullPage: true });
  console.log('Screenshot saved: code-blocks-debug.png\n');

  console.log('=== Browser will stay open for manual inspection (30 seconds) ===\n');
  await page.waitForTimeout(30000);

  await browser.close();
})();
