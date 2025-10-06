const { chromium } = require('playwright');

// Calculate relative luminance for WCAG contrast
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Analyzing Color Contrast ===\n');

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Get CSS custom properties
  const colors = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    const colorVars = [
      '--color-brand',
      '--color-brand-dark',
      '--color-brand-light',
      '--color-accent',
      '--color-bg',
      '--color-bg-alt',
      '--color-bg-code',
      '--color-border',
      '--color-border-light',
      '--color-text',
      '--color-text-secondary',
      '--color-text-tertiary',
    ];

    const result = {};
    colorVars.forEach(varName => {
      const value = styles.getPropertyValue(varName).trim();
      result[varName] = value;
    });

    return result;
  });

  console.log('Light Mode Colors:');
  Object.entries(colors).forEach(([name, value]) => {
    console.log(`  ${name}: ${value}`);
  });
  console.log('');

  // Sample text elements and their colors
  const textSamples = await page.evaluate(() => {
    const samples = [];

    // Get some text elements
    const selectors = [
      'h1', 'h2', 'h3', 'p',
      '.sidebar button',
      'a',
      '.prose',
      '.nav-link',
      '.color-text-secondary'
    ];

    selectors.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        const styles = window.getComputedStyle(el);
        const parent = el.parentElement;
        const parentStyles = parent ? window.getComputedStyle(parent) : null;

        samples.push({
          selector,
          text: el.textContent?.substring(0, 30) || '',
          color: styles.color,
          backgroundColor: styles.backgroundColor || (parentStyles ? parentStyles.backgroundColor : ''),
        });
      }
    });

    return samples;
  });

  console.log('=== Text Samples with Contrast Analysis ===\n');

  textSamples.forEach(sample => {
    // Parse RGB values
    const colorMatch = sample.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const bgMatch = sample.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (colorMatch && bgMatch) {
      const textRgb = [parseInt(colorMatch[1]), parseInt(colorMatch[2]), parseInt(colorMatch[3])];
      const bgRgb = [parseInt(bgMatch[1]), parseInt(bgMatch[2]), parseInt(bgMatch[3])];
      const contrast = getContrastRatio(textRgb, bgRgb);

      const passAA = contrast >= 4.5;
      const passAAA = contrast >= 7;

      console.log(`${sample.selector}:`);
      console.log(`  Text: "${sample.text}"`);
      console.log(`  Color: ${sample.color}`);
      console.log(`  Background: ${sample.backgroundColor}`);
      console.log(`  Contrast: ${contrast.toFixed(2)}:1 ${passAAA ? '✅ AAA' : passAA ? '✅ AA' : '❌ FAIL'}`);
      console.log('');
    }
  });

  // Take screenshots
  console.log('=== Taking Screenshots ===');
  await page.screenshot({ path: 'light-mode.png', fullPage: false });
  console.log('Saved: light-mode.png');

  // Check if there's a dark mode toggle
  const hasDarkModeToggle = await page.evaluate(() => {
    return !!document.querySelector('[data-theme]') ||
           !!document.querySelector('button:has-text("Dark")') ||
           !!document.querySelector('button:has-text("Light")');
  });

  console.log(`\nDark mode toggle found: ${hasDarkModeToggle}`);

  console.log('\n=== Recommendations ===');
  console.log('Based on the analysis, elements with contrast ratio < 4.5:1 need improvement.');
  console.log('Consider darkening these light mode colors:');
  console.log('  - --color-text-secondary (currently #666666)');
  console.log('  - --color-text-tertiary (currently #999999)');
  console.log('  - --color-border (currently #e0e0e0)');
  console.log('\n=== Keeping browser open for 30 seconds ===\n');

  await page.waitForTimeout(30000);

  await browser.close();
})();
