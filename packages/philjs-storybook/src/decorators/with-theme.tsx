/**
 * Theme Decorator
 *
 * Wrap stories with theme support
 */

import { createContext, useContext } from 'philjs-core/context';
import { signal } from 'philjs-core';
import type { StoryContext } from '../renderer.js';
import { setTheme, type Theme } from '../addons/theme-switcher.js';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  colors: {},
});

/**
 * Theme decorator
 */
export function withTheme(
  story: () => any,
  context: StoryContext
): any {
  const initialTheme = (context.parameters?.theme || 'light') as Theme;
  const theme$ = signal<Theme>(initialTheme);

  const themeContext: ThemeContextValue = {
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
    <ThemeContext.Provider value={themeContext}>
      {story()}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme in stories
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
