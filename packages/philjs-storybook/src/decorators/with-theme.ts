/**
 * Theme Decorator
 *
 * Wraps stories with theme context
 */

import { signal } from 'philjs-core';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface WithThemeOptions {
  defaultTheme?: ThemeMode;
  themes?: Record<string, Record<string, string>>;
}

/**
 * Decorator that provides theme context to stories
 */
export function withTheme(options: WithThemeOptions = {}) {
  const { defaultTheme = 'light', themes = {} } = options;

  return (storyFn: () => any, context: any) => {
    const theme$ = signal<ThemeMode>(defaultTheme);

    // Apply theme styles
    const applyTheme = (mode: ThemeMode) => {
      const themeVars = themes[mode];
      if (themeVars) {
        const root = document.documentElement;
        for (const key of Object.keys(themeVars)) {
          const value = themeVars[key];
          if (value !== undefined) {
            root.style.setProperty(`--${key}`, value);
          }
        }
      }
    };

    // Apply initial theme
    applyTheme(defaultTheme);

    // Attach theme utilities to context
    if (context && context.parameters) {
      context.parameters['theme'] = {
        current: theme$,
        setTheme: (mode: ThemeMode) => {
          theme$.set(mode);
          applyTheme(mode);
        },
      };
    }

    return storyFn();
  };
}
