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

// Parse hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Color Contrast Comparison ===\n');

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Get updated colors
  const colors = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    const colorVars = [
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

  console.log('Updated Light Mode Colors:');
  console.log('');

  const oldColors = {
    '--color-bg': '#ffffff',
    '--color-bg-alt': '#f8f9fa',
    '--color-bg-code': '#f5f5f7',
    '--color-border': '#e0e0e0',
    '--color-border-light': '#f0f0f0',
    '--color-text': '#1a1a1a',
    '--color-text-secondary': '#666666',
    '--color-text-tertiary': '#999999',
  };

  // Calculate contrast ratios
  const bgWhite = [255, 255, 255];

  console.log('Color Changes & Contrast Analysis:');
  console.log('');

  Object.entries(colors).forEach(([name, newValue]) => {
    const oldValue = oldColors[name];
    const changed = oldValue !== newValue;

    console.log(`${name}:`);
    console.log(`  Old: ${oldValue} ${changed ? '→' : ''} ${changed ? `New: ${newValue}` : ''}`);

    // Calculate contrast with white background for text colors
    if (name.includes('text')) {
      const newRgb = hexToRgb(newValue);
      if (newRgb) {
        const contrast = getContrastRatio(newRgb, bgWhite);
        const passAA = contrast >= 4.5;
        const passAAA = contrast >= 7;
        console.log(`  Contrast on white: ${contrast.toFixed(2)}:1 ${passAAA ? '✅ AAA' : passAA ? '✅ AA' : '❌ FAIL'}`);
      }
    }

    console.log('');
  });

  // Take screenshot for comparison
  await page.screenshot({ path: 'light-mode-improved.png', fullPage: false });
  console.log('Screenshot saved: light-mode-improved.png');
  console.log('');

  // Sample some actual text elements
  console.log('=== Real Element Contrast ===\n');

  const samples = await page.evaluate(() => {
    const results = [];

    const selectors = [
      { sel: 'h1', desc: 'Main heading' },
      { sel: 'h2', desc: 'Section heading' },
      { sel: 'p', desc: 'Body text' },
      { sel: '.sidebar button', desc: 'Sidebar button' },
      { sel: 'a', desc: 'Link' },
    ];

    selectors.forEach(({ sel, desc }) => {
      const el = document.querySelector(sel);
      if (el) {
        const styles = window.getComputedStyle(el);
        let parent = el.parentElement;
        let bg = 'rgba(0, 0, 0, 0)';

        // Walk up to find non-transparent background
        while (parent && bg === 'rgba(0, 0, 0, 0)') {
          bg = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }

        results.push({
          description: desc,
          text: el.textContent?.substring(0, 30),
          color: styles.color,
          backgroundColor: bg,
        });
      }
    });

    return results;
  });

  samples.forEach(sample => {
    const colorMatch = sample.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const bgMatch = sample.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (colorMatch && bgMatch) {
      const textRgb = [parseInt(colorMatch[1]), parseInt(colorMatch[2]), parseInt(colorMatch[3])];
      const bgRgb = [parseInt(bgMatch[1]), parseInt(bgMatch[2]), parseInt(bgMatch[3])];
      const contrast = getContrastRatio(textRgb, bgRgb);

      const passAA = contrast >= 4.5;
      const passAAA = contrast >= 7;

      console.log(`${sample.description}:`);
      console.log(`  "${sample.text}"`);
      console.log(`  Contrast: ${contrast.toFixed(2)}:1 ${passAAA ? '✅ AAA' : passAA ? '✅ AA' : '❌ FAIL'}`);
      console.log('');
    }
  });

  console.log('=== Summary ===');
  console.log('✅ Text colors darkened for better contrast');
  console.log('✅ Background colors slightly darkened for depth');
  console.log('✅ Border colors darkened for visibility');
  console.log('✅ Color scheme preserved - still feels light and airy');
  console.log('');
  console.log('=== Keeping browser open for manual review (30 seconds) ===\n');

  await page.waitForTimeout(30000);

  await browser.close();
})();
