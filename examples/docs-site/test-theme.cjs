const { chromium } = require('playwright');

async function testThemeContrast() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the introduction page with playground
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForTimeout(2000);

  console.log('\n=== CHECKING DARK MODE ===');

  // Check if we're in dark mode
  const theme = await page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme');
  });
  console.log('Current theme:', theme);

  // Get playground styles
  const playgroundStyles = await page.evaluate(() => {
    const editor = document.querySelector('.code-editor-textarea');
    const output = document.querySelector('.preview-output');
    const header = document.querySelector('.code-playground-header');

    if (!editor || !output) {
      return { error: 'Playground not found' };
    }

    const getStyles = (el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor,
      };
    };

    return {
      editor: getStyles(editor),
      output: getStyles(output),
      header: header ? getStyles(header) : null,
    };
  });

  console.log('Playground styles (Dark Mode):', JSON.stringify(playgroundStyles, null, 2));

  // Switch to light mode
  console.log('\n=== SWITCHING TO LIGHT MODE ===');
  await page.click('button[aria-label*="Switch to light"]');
  await page.waitForTimeout(1000);

  // Check light mode styles
  const lightTheme = await page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme');
  });
  console.log('Current theme:', lightTheme);

  const lightStyles = await page.evaluate(() => {
    const editor = document.querySelector('.code-editor-textarea');
    const output = document.querySelector('.preview-output');
    const header = document.querySelector('.code-playground-header');

    const getStyles = (el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor,
      };
    };

    return {
      editor: getStyles(editor),
      output: getStyles(output),
      header: header ? getStyles(header) : null,
    };
  });

  console.log('Playground styles (Light Mode):', JSON.stringify(lightStyles, null, 2));

  // Check CSS variables
  console.log('\n=== CSS VARIABLES ===');
  const cssVars = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    return {
      '--color-bg': computed.getPropertyValue('--color-bg'),
      '--color-bg-alt': computed.getPropertyValue('--color-bg-alt'),
      '--color-bg-code': computed.getPropertyValue('--color-bg-code'),
      '--color-text': computed.getPropertyValue('--color-text'),
      '--color-code-text': computed.getPropertyValue('--color-code-text'),
      '--color-border': computed.getPropertyValue('--color-border'),
    };
  });

  console.log('CSS Variables (Light Mode):', JSON.stringify(cssVars, null, 2));

  // Take screenshots
  await page.screenshot({ path: 'theme-light.png', fullPage: true });
  console.log('\n✓ Screenshot saved: theme-light.png');

  // Switch back to dark mode
  await page.click('button[aria-label*="Switch to dark"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'theme-dark.png', fullPage: true });
  console.log('✓ Screenshot saved: theme-dark.png');

  // Keep browser open for inspection
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

testThemeContrast().catch(console.error);
