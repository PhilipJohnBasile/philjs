/**
 * PhilJS Styles Vite Plugin
 *
 * Provides CSS scoping, CSS Modules, and style extraction for PhilJS.
 */

import type { Plugin } from 'vite';
import { generateHash } from './utils';

export interface PhilJSStylesPluginOptions {
  /** Enable CSS scoping */
  scoping?: boolean;
  /** CSS Modules configuration */
  cssModules?: {
    scopeBehaviour?: 'local' | 'global';
    localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly';
  };
  /** Extract critical CSS for SSR */
  extractCritical?: boolean;
  /** Prefix for scoped class names */
  classPrefix?: string;
}

export function philjsStylesPlugin(options: PhilJSStylesPluginOptions = {}): Plugin {
  const {
    scoping = true,
    cssModules = {},
    extractCritical = false,
    classPrefix = 'philjs',
  } = options;

  const styleMap = new Map<string, string>();

  return {
    name: 'philjs-styles',
    enforce: 'pre',

    config() {
      return {
        css: {
          modules: {
            scopeBehaviour: cssModules.scopeBehaviour || 'local',
            localsConvention: cssModules.localsConvention || 'camelCaseOnly',
          },
        },
      };
    },

    transform(code, id) {
      // Handle .philjs.css files (scoped CSS)
      if (id.endsWith('.philjs.css') && scoping) {
        const hash = generateHash(id);
        const scopedClass = `${classPrefix}-${hash}`;

        // Scope all selectors
        const scopedCSS = scopeCSS(code, scopedClass);
        styleMap.set(id, scopedCSS);

        // Return module that exports the scoped class
        return {
          code: `
            const style = document.createElement('style');
            style.textContent = ${JSON.stringify(scopedCSS)};
            document.head.appendChild(style);
            export const scopedClass = ${JSON.stringify(scopedClass)};
            export default ${JSON.stringify(scopedClass)};
          `,
          map: null,
        };
      }

      // Handle inline css`` tagged templates
      if ((id.endsWith('.tsx') || id.endsWith('.ts')) && code.includes('css`')) {
        return transformTaggedTemplates(code, id, classPrefix);
      }

      return null;
    },

    // Extract critical CSS for SSR
    generateBundle(_, bundle) {
      if (!extractCritical) return;

      const criticalCSS = Array.from(styleMap.values()).join('\n');

      if (criticalCSS) {
        this.emitFile({
          type: 'asset',
          fileName: 'critical.css',
          source: criticalCSS,
        });
      }
    },
  };
}

/**
 * Scope CSS selectors
 */
function scopeCSS(css: string, scopedClass: string): string {
  // Simple regex-based scoping
  return css.replace(
    /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g,
    (match, selector, ending) => {
      const trimmed = selector.trim();

      // Skip at-rules and keyframe keywords
      if (trimmed.startsWith('@') || trimmed === 'from' || trimmed === 'to' || /^\d+%$/.test(trimmed)) {
        return match;
      }

      // Handle :global() pseudo-class
      if (trimmed.includes(':global(')) {
        return match.replace(/:global\(([^)]+)\)/g, '$1');
      }

      // Handle :global selector
      if (trimmed.startsWith(':global')) {
        return match.replace(':global', '');
      }

      // Scope the selector
      const scopedSelector = selector
        .split(',')
        .map((s: string) => {
          s = s.trim();
          if (!s) return s;

          // Handle & parent selector
          if (s === '&') return `.${scopedClass}`;
          if (s.startsWith('&')) return `.${scopedClass}${s.slice(1)}`;

          // Add scoped class
          return `.${scopedClass} ${s}`;
        })
        .join(', ');

      return `${scopedSelector}${ending}`;
    }
  );
}

/**
 * Transform css`` tagged templates
 */
function transformTaggedTemplates(code: string, id: string, prefix: string): { code: string; map: null } | null {
  // Find css`` tagged templates
  const cssTagRegex = /css`([^`]*)`/g;
  let match;
  let transformed = code;
  let hasTransforms = false;

  while ((match = cssTagRegex.exec(code)) !== null) {
    const cssContent = match[1];
    const hash = generateHash(cssContent + id);
    const scopedClass = `${prefix}-${hash}`;

    // Scope the CSS
    const scopedCSS = scopeCSS(cssContent, scopedClass);

    // Replace the css`` call with the class name and inject the styles
    const replacement = `(() => {
      if (typeof document !== 'undefined') {
        const existingStyle = document.querySelector('[data-philjs="${hash}"]');
        if (!existingStyle) {
          const style = document.createElement('style');
          style.setAttribute('data-philjs', '${hash}');
          style.textContent = ${JSON.stringify(scopedCSS)};
          document.head.appendChild(style);
        }
      }
      return '${scopedClass}';
    })()`;

    transformed = transformed.replace(match[0], replacement);
    hasTransforms = true;
  }

  if (hasTransforms) {
    return { code: transformed, map: null };
  }

  return null;
}

export default philjsStylesPlugin;
