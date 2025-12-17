/**
 * PhilJS Tailwind Vite Plugin
 *
 * Optimizations for Tailwind CSS in PhilJS applications.
 */

import type { Plugin } from 'vite';

export interface PhilJSTailwindViteOptions {
  /** Enable Just-in-Time mode optimizations */
  jit?: boolean;
  /** Content paths for Tailwind */
  content?: string[];
  /** Purge unused styles in production */
  purge?: boolean;
  /** Extract critical CSS for SSR */
  extractCritical?: boolean;
}

export function philjsTailwindVite(options: PhilJSTailwindViteOptions = {}): Plugin {
  const {
    jit = true,
    content = ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
    purge = true,
    extractCritical = false,
  } = options;

  let criticalCSS = '';

  return {
    name: 'philjs-tailwind',
    enforce: 'pre',

    config(config, { mode }) {
      return {
        css: {
          postcss: {
            plugins: [
              require('tailwindcss')({
                content,
                ...(jit && { mode: 'jit' }),
              }),
              require('autoprefixer')(),
            ],
          },
        },
        optimizeDeps: {
          include: ['tailwindcss'],
        },
      };
    },

    transform(code, id) {
      // Extract critical CSS from main CSS file
      if (extractCritical && id.endsWith('.css') && id.includes('index')) {
        criticalCSS += code;
      }
      return null;
    },

    generateBundle(_, bundle) {
      if (extractCritical && criticalCSS) {
        this.emitFile({
          type: 'asset',
          fileName: 'critical.css',
          source: extractCriticalStyles(criticalCSS),
        });
      }
    },

    transformIndexHtml(html) {
      if (extractCritical && criticalCSS) {
        // Inject critical CSS inline
        const critical = extractCriticalStyles(criticalCSS);
        return html.replace(
          '</head>',
          `<style id="critical-css">${critical}</style></head>`
        );
      }
      return html;
    },
  };
}

/**
 * Extract critical (above-the-fold) styles
 */
function extractCriticalStyles(css: string): string {
  // Simple extraction - in production, use a proper tool like critical
  // This extracts basic layout and typography classes
  const criticalPatterns = [
    /\.container[^{]*\{[^}]+\}/g,
    /\.flex[^{]*\{[^}]+\}/g,
    /\.grid[^{]*\{[^}]+\}/g,
    /\.block[^{]*\{[^}]+\}/g,
    /\.inline[^{]*\{[^}]+\}/g,
    /\.text-[^{]*\{[^}]+\}/g,
    /\.font-[^{]*\{[^}]+\}/g,
    /\.bg-[^{]*\{[^}]+\}/g,
    /\.p-[^{]*\{[^}]+\}/g,
    /\.m-[^{]*\{[^}]+\}/g,
    /\.w-[^{]*\{[^}]+\}/g,
    /\.h-[^{]*\{[^}]+\}/g,
    /\.min-[^{]*\{[^}]+\}/g,
    /\.max-[^{]*\{[^}]+\}/g,
  ];

  const critical: string[] = [];
  for (const pattern of criticalPatterns) {
    const matches = css.match(pattern);
    if (matches) {
      critical.push(...matches);
    }
  }

  return critical.join('\n');
}

export default philjsTailwindVite;
