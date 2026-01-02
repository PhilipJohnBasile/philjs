/**
 * PhilJS UI - Theme Provider
 *
 * Provides theming context including dark mode support
 */
import { createContext, useContext, signal, effect } from '@philjs/core';
import type { JSX } from '@philjs/core/jsx-runtime';
import { defaultTheme } from './tokens';
import type { Theme } from './tokens';

type ColorMode = 'light' | 'dark' | 'system';

type ResolvedMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colorMode: () => ColorMode;
  setColorMode: (mode: ColorMode) => void;
  isDark: () => boolean;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: JSX.Element | JSX.Element[];
  theme?: Partial<Theme>;
  defaultColorMode?: ColorMode;
  storageKey?: string;
}

export function ThemeProvider(props: ThemeProviderProps): JSX.Element {
  const {
    children,
    theme: customTheme,
    defaultColorMode = 'system',
    storageKey = 'philjs-color-mode',
  } = props;

  // Merge custom theme with defaults
  const theme: Theme = {
    ...defaultTheme,
    ...customTheme,
    colors: {
      ...defaultTheme.colors,
      ...customTheme?.colors,
    },
  } as Theme;

  // Color mode state
  const colorMode = signal<ColorMode>(defaultColorMode);
  const resolvedMode = signal<ResolvedMode>('light');

  // Initialize from storage
  effect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as ColorMode | null;
      if (stored) {
        colorMode.set(stored);
      }
    }
  });

  // Resolve system preference and apply
  effect(() => {
    const mode = colorMode();
    if (typeof window === 'undefined') return;

    let resolved: ResolvedMode;

    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      resolved = mode;
    }

    resolvedMode.set(resolved);

    // Apply to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    document.documentElement.setAttribute('data-theme', resolved);

    // Store preference
    localStorage.setItem(storageKey, mode);
  });

  // Listen for system changes
  effect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (): void => {
      if (colorMode() === 'system') {
        resolvedMode.set(mediaQuery.matches ? 'dark' : 'light');
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolvedMode());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  });

  const setColorMode = (mode: ColorMode): void => {
    colorMode.set(mode);
  };

  const isDark = (): boolean => resolvedMode() === 'dark';

  const toggleColorMode = (): void => {
    const current = resolvedMode();
    colorMode.set(current === 'dark' ? 'light' : 'dark');
  };

  const value: ThemeContextValue = {
    theme,
    colorMode: () => colorMode(),
    setColorMode,
    isDark,
    toggleColorMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook for color mode only
 */
export function useColorMode(): {
  colorMode: () => ColorMode;
  setColorMode: (mode: ColorMode) => void;
  isDark: () => boolean;
  toggleColorMode: () => void;
} {
  const { colorMode, setColorMode, isDark, toggleColorMode } = useTheme();
  return {
    colorMode,
    setColorMode,
    isDark,
    toggleColorMode,
  };
}

/**
 * CSS custom properties for theming
 */
export function generateCSSVariables(theme: Theme): string {
  const vars: string[] = [];

  // Colors
  Object.entries(theme.colors).forEach(([colorName, colorValue]) => {
    if (typeof colorValue === 'object') {
      Object.entries(colorValue).forEach(([shade, value]) => {
        vars.push(`--color-${colorName}-${shade}: ${value};`);
      });
    } else {
      vars.push(`--color-${colorName}: ${colorValue};`);
    }
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    vars.push(`--spacing-${key}: ${value};`);
  });

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    vars.push(`--radius-${key}: ${value};`);
  });

  // Shadows
  Object.entries(theme.boxShadow).forEach(([key, value]) => {
    vars.push(`--shadow-${key}: ${value};`);
  });

  // Z-index
  Object.entries(theme.zIndex).forEach(([key, value]) => {
    vars.push(`--z-${key}: ${value};`);
  });

  return `:root {\n  ${vars.join('\n  ')}\n}`;
}
