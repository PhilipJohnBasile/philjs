/**
 * PhilJS CSS Modules Support
 *
 * Import and use CSS Modules with type safety.
 */

import type { CSSModuleConfig } from './types';

// CSS Module class mapping type
export type CSSModuleClasses = {
  readonly [key: string]: string;
};

/**
 * Create a CSS Modules helper
 */
export function cssModules<T extends CSSModuleClasses>(
  classes: T
): T & { compose: (...classNames: (keyof T | string | undefined | null | false)[]) => string } {
  return {
    ...classes,
    compose(...classNames) {
      return classNames
        .filter(Boolean)
        .map((name) => {
          if (typeof name === 'string' && name in classes) {
            return classes[name as keyof T];
          }
          return name;
        })
        .join(' ');
    },
  };
}

/**
 * Hook for using CSS Modules in components
 */
export function useCSSModule<T extends CSSModuleClasses>(
  styles: T
): {
  styles: T;
  cx: (...classNames: (keyof T | string | undefined | null | false)[]) => string;
  getClass: (name: keyof T) => string;
} {
  return {
    styles,
    cx(...classNames) {
      return classNames
        .filter(Boolean)
        .map((name) => {
          if (typeof name === 'string' && name in styles) {
            return styles[name as keyof T];
          }
          return name;
        })
        .join(' ');
    },
    getClass(name) {
      return styles[name] || '';
    },
  };
}

/**
 * Bind styles to a component for easier usage
 */
export function bindStyles<T extends CSSModuleClasses>(styles: T) {
  const boundStyles = {} as {
    [K in keyof T]: string;
  } & {
    cx: (...names: (keyof T | string | boolean | null | undefined)[]) => string;
  };

  for (const key of Object.keys(styles) as (keyof T)[]) {
    (boundStyles as any)[key] = styles[key];
  }

  boundStyles.cx = (...names) => {
    return names
      .filter(Boolean)
      .map((name) => {
        if (typeof name === 'string' && name in styles) {
          return styles[name as keyof T];
        }
        return typeof name === 'string' ? name : '';
      })
      .filter(Boolean)
      .join(' ');
  };

  return boundStyles;
}

/**
 * Generate CSS Module loader config for build tools
 */
export function getCSSModuleConfig(options: CSSModuleConfig = {}) {
  const {
    scopeBehaviour = 'local',
    localIdentName = '[name]__[local]__[hash:base64:5]',
    exportLocalsConvention = 'camelCaseOnly',
  } = options;

  return {
    // For Vite
    vite: {
      css: {
        modules: {
          scopeBehaviour,
          localsConvention: exportLocalsConvention,
          generateScopedName: localIdentName,
        },
      },
    },

    // For PostCSS
    postcss: {
      'postcss-modules': {
        scopeBehaviour,
        localsConvention: exportLocalsConvention,
        generateScopedName: localIdentName,
      },
    },

    // For Webpack
    webpack: {
      modules: {
        mode: scopeBehaviour,
        localIdentName,
        exportLocalsConvention,
      },
    },
  };
}

/**
 * Type-safe CSS Module import helper
 */
export function importCSSModule<T extends CSSModuleClasses>(
  modulePromise: Promise<{ default: T }>
): Promise<T> {
  return modulePromise.then((m) => m.default);
}

/**
 * Create conditional class names from CSS Module
 */
export function createClassNames<T extends CSSModuleClasses>(styles: T) {
  return function classNames(
    conditions: Partial<{ [K in keyof T]: boolean }> | (keyof T)[]
  ): string {
    if (Array.isArray(conditions)) {
      return conditions.map((name) => styles[name]).join(' ');
    }

    return Object.entries(conditions)
      .filter(([, condition]) => condition)
      .map(([name]) => styles[name as keyof T])
      .join(' ');
  };
}
