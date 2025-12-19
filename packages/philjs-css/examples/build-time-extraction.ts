/**
 * Build-time CSS Extraction Examples
 *
 * This file demonstrates how to extract CSS at build time
 * for zero runtime overhead.
 */

import {
  css,
  createTheme,
  variants,
  createAtomicSystem,
  extractCSS,
  extractToFile,
  extractCriticalCSS,
  analyzeCSSBundle,
  createVitePlugin
} from '../src';

// ===================================
// 1. Define Your Styles
// ===================================

const theme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444'
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px'
  }
});

const button = css({
  padding: theme.spacing.md,
  backgroundColor: theme.colors.primary,
  color: 'white',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: '#2563eb'
  }
});

const card = css({
  padding: theme.spacing.lg,
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
});

const buttonVariants = variants({
  base: {
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  variants: {
    color: {
      primary: { backgroundColor: theme.colors.primary },
      danger: { backgroundColor: theme.colors.danger }
    },
    size: {
      sm: { padding: '6px 12px' },
      lg: { padding: '14px 28px' }
    }
  }
});

const atoms = createAtomicSystem({
  spacing: theme.spacing,
  colors: theme.colors
});

// ===================================
// 2. Extract All CSS (Manual)
// ===================================

export function extractAllCSS() {
  const css = extractCSS({
    minify: true,
    sourceMap: true,
    atomicClasses: true
  });

  console.log('Generated CSS:', css);
  return css;
}

// ===================================
// 3. Extract to File (Node.js)
// ===================================

export async function extractToFileExample() {
  await extractToFile('./dist/styles.css', {
    minify: true,
    sourceMap: true,
    atomicClasses: true
  });

  console.log('CSS extracted to ./dist/styles.css');
}

// ===================================
// 4. Extract Critical CSS for SSR
// ===================================

export function extractCriticalExample() {
  // Simulate server-rendered HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>My App</title></head>
      <body>
        <div class="${card.className}">
          <button class="${button.className}">Click me</button>
        </div>
      </body>
    </html>
  `;

  // Extract only the CSS used in this HTML
  const criticalCSS = extractCriticalCSS(html, { minify: true });

  // Inject critical CSS inline
  const htmlWithCSS = html.replace(
    '</head>',
    `<style>${criticalCSS}</style></head>`
  );

  console.log('HTML with critical CSS:', htmlWithCSS);
  return htmlWithCSS;
}

// ===================================
// 5. Bundle Analysis
// ===================================

export function analyzeBundle() {
  const stats = analyzeCSSBundle();

  console.log('CSS Bundle Statistics:');
  console.log(`- Total size: ${stats.totalSize} bytes`);
  console.log(`- Minified: ${stats.minifiedSize} bytes`);
  console.log(`- Estimated gzipped: ${stats.gzipSize} bytes`);
  console.log(`- Number of classes: ${stats.classCount}`);
  console.log(`- Number of rules: ${stats.ruleCount}`);
  console.log(`- Theme variables: ${stats.themeVars}`);

  // Calculate compression ratios
  const minificationRatio = (
    ((stats.totalSize - stats.minifiedSize) / stats.totalSize) *
    100
  ).toFixed(1);
  const gzipRatio = (
    ((stats.minifiedSize - stats.gzipSize) / stats.minifiedSize) *
    100
  ).toFixed(1);

  console.log(`\nCompression:`);
  console.log(`- Minification: ${minificationRatio}% reduction`);
  console.log(`- Gzip: ${gzipRatio}% additional reduction`);

  return stats;
}

// ===================================
// 6. Vite Plugin Configuration
// ===================================

export function viteConfig() {
  return {
    plugins: [
      createVitePlugin({
        outputPath: 'styles.css',
        minify: true,
        sourceMap: true,
        atomicClasses: true
      })
    ]
  };
}

// ===================================
// 7. Build Script Example
// ===================================

export async function buildStyles() {
  console.log('Building CSS...');

  // Extract all CSS
  const css = extractCSS({
    minify: process.env.NODE_ENV === 'production',
    sourceMap: process.env.NODE_ENV !== 'production',
    atomicClasses: true
  });

  // Write to file
  await extractToFile('./dist/styles.css', {
    minify: process.env.NODE_ENV === 'production',
    sourceMap: process.env.NODE_ENV !== 'production',
    atomicClasses: true
  });

  // Analyze bundle
  const stats = analyzeCSSBundle();

  console.log('\nBuild complete!');
  console.log(`Output: ${stats.minifiedSize} bytes (${stats.gzipSize} bytes gzipped)`);

  return css;
}

// ===================================
// 8. SSR with Critical CSS
// ===================================

export function renderWithCriticalCSS(renderApp: () => string) {
  // Render the app
  const appHtml = renderApp();

  // Extract only the CSS used
  const criticalCSS = extractCriticalCSS(appHtml, {
    minify: true
  });

  // Create full HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My App</title>
        <style>${criticalCSS}</style>
        <link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'">
      </head>
      <body>
        <div id="app">${appHtml}</div>
        <script src="/app.js"></script>
      </body>
    </html>
  `;

  return html;
}

// ===================================
// 9. Development vs Production
// ===================================

export function getBuildConfig() {
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    outputPath: isDev ? './dev/styles.css' : './dist/styles.css',
    minify: !isDev,
    sourceMap: isDev,
    atomicClasses: true
  };
}

// ===================================
// 10. Watch Mode for Development
// ===================================

export async function watchStyles() {
  const fs = await import('fs/promises');
  const path = await import('path');

  let lastHash = '';

  async function rebuild() {
    const css = extractCSS({
      minify: false,
      sourceMap: true,
      atomicClasses: true
    });

    // Check if CSS changed
    const currentHash = hashString(css);
    if (currentHash === lastHash) {
      return;
    }

    lastHash = currentHash;

    // Write to file
    const outputPath = './dev/styles.css';
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, css, 'utf-8');

    console.log(`[${new Date().toLocaleTimeString()}] CSS updated`);
  }

  // Initial build
  await rebuild();

  // Watch for changes (simplified - in real implementation use chokidar)
  console.log('Watching for changes...');

  return {
    rebuild,
    close: () => {
      console.log('Stopped watching');
    }
  };
}

// Helper function
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// ===================================
// Usage Examples
// ===================================

if (require.main === module) {
  // Run build
  buildStyles()
    .then(() => {
      console.log('\nAnalyzing bundle...');
      analyzeBundle();
    })
    .catch(console.error);
}
