/**
 * Theme Decorator
 *
 * Wrap stories with theme support
 */

import { createContext } from 'philjs-core/context';
import { signal } from 'philjs-core';
import type { StoryContext } from '../renderer.js';
import { setTheme, type Theme } from '../addons/theme-switcher.js';

export interface ThemeContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: Record<string, string>;
}

const ThemeContextInstance = createContext<ThemeContext>();

/**
 * Theme decorator
 */
export function withTheme(
  story: () => any,
  context: StoryContext
): any {
  const initialTheme = (context.parameters?.theme || 'light') as Theme;
  const theme$ = signal<Theme>(initialTheme);

  const themeContext: ThemeContext = {
    get theme() {
      return theme$();
    },
    setTheme: (theme: Theme) => {
      theme$.set(theme);
      setTheme(theme);
    },
    colors: context.parameters?.themeColors || {},
  };

  // Apply theme on mount
  setTheme(initialTheme);

  return (
    <ThemeContextInstance.Provider value={themeContext}>
      {story()}
    </ThemeContextInstance.Provider>
  );
}

/**
 * Hook to access theme in stories
 */
export function useTheme(): ThemeContext {
  return ThemeContextInstance.use();
}
