# Theming

Build comprehensive theme systems with dark mode and custom themes in PhilJS.

## What You'll Learn

- Theme structure
- Theme context
- Dark mode implementation
- CSS variables
- Theme switching
- Persistence
- Best practices

## Theme Structure

### Basic Theme

```typescript
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#dee2e6'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
  }
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    background: '#212529',
    surface: '#343a40',
    text: '#f8f9fa',
    textSecondary: '#adb5bd',
    border: '#495057'
  }
};
```

## Theme Context

### Theme Provider

```typescript
import { createContext, signal } from '@philjs/core';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: () => Theme;
  mode: () => ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>();

export function ThemeProvider({ children }: { children: any }) {
  const mode = signal<ThemeMode>('light');

  const theme = () => (mode() === 'light' ? lightTheme : darkTheme);

  const setMode = (newMode: ThemeMode) => {
    mode.set(newMode);
  };

  const toggleMode = () => {
    mode.set(mode() === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return ThemeContext.use();
}
```

### Using Theme

```typescript
import { useTheme } from './ThemeProvider';

export function ThemedButton({ children }: { children: any }) {
  const { theme } = useTheme();

  const styles = {
    padding: `${theme().spacing.sm} ${theme().spacing.md}`,
    backgroundColor: theme().colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: theme().borderRadius.md,
    fontFamily: theme().typography.fontFamily,
    fontSize: theme().typography.fontSize.md,
    fontWeight: theme().typography.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  return <button style={styles}>{children}</button>;
}
```

## Dark Mode

### Dark Mode Toggle

```typescript
import { useTheme } from './ThemeProvider';

export function DarkModeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      style={{
        padding: '8px 12px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        background: 'transparent'
      }}
      aria-label={`Switch to ${mode() === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode() === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### System Preference Detection

```typescript
import { signal, effect } from '@philjs/core';

function useSystemTheme() {
  const systemTheme = signal<'light' | 'dark'>('light');

  effect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    systemTheme.set(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      systemTheme.set(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  });

  return systemTheme;
}

export function ThemeProvider({ children }: { children: any }) {
  const systemTheme = useSystemTheme();
  const mode = signal<ThemeMode | 'system'>('system');

  const effectiveMode = () => {
    if (mode() === 'system') {
      return systemTheme();
    }
    return mode() as ThemeMode;
  };

  const theme = () => (effectiveMode() === 'light' ? lightTheme : darkTheme);

  return (
    <ThemeContext.Provider value={{ theme, mode: effectiveMode, setMode: mode.set }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## CSS Variables

### Generate CSS Variables

```typescript
import { effect } from '@philjs/core';

function themeToCSSVariables(theme: Theme): Record<string, string> {
  return {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-success': theme.colors.success,
    '--color-danger': theme.colors.danger,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-text': theme.colors.text,
    '--color-text-secondary': theme.colors.textSecondary,
    '--color-border': theme.colors.border,

    '--spacing-xs': theme.spacing.xs,
    '--spacing-sm': theme.spacing.sm,
    '--spacing-md': theme.spacing.md,
    '--spacing-lg': theme.spacing.lg,
    '--spacing-xl': theme.spacing.xl,

    '--font-family': theme.typography.fontFamily,
    '--font-size-xs': theme.typography.fontSize.xs,
    '--font-size-sm': theme.typography.fontSize.sm,
    '--font-size-md': theme.typography.fontSize.md,
    '--font-size-lg': theme.typography.fontSize.lg,
    '--font-size-xl': theme.typography.fontSize.xl,

    '--border-radius-sm': theme.borderRadius.sm,
    '--border-radius-md': theme.borderRadius.md,
    '--border-radius-lg': theme.borderRadius.lg,

    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg
  };
}

export function ThemeProvider({ children }: { children: any }) {
  const mode = signal<ThemeMode>('light');
  const theme = () => (mode() === 'light' ? lightTheme : darkTheme);

  // Apply CSS variables to document root
  effect(() => {
    const variables = themeToCSSVariables(theme());

    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  });

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode: mode.set }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Using CSS Variables

```css
/* styles.css */
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-md);
}

.card {
  background-color: var(--color-surface);
  color: var(--color-text);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}
```

## Theme Persistence

### LocalStorage Persistence

```typescript
import { signal, effect } from '@philjs/core';

const THEME_STORAGE_KEY = 'app-theme';

export function ThemeProvider({ children }: { children: any }) {
  // Load saved theme on mount
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  const mode = signal<ThemeMode>(savedTheme || 'light');

  const theme = () => (mode() === 'light' ? lightTheme : darkTheme);

  // Save theme changes to localStorage
  effect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode());
  });

  const setMode = (newMode: ThemeMode) => {
    mode.set(newMode);
  };

  const toggleMode = () => {
    mode.set(mode() === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Cookie Persistence

```typescript
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export function ThemeProvider({ children }: { children: any }) {
  const savedTheme = getCookie(THEME_STORAGE_KEY) as ThemeMode | null;
  const mode = signal<ThemeMode>(savedTheme || 'light');

  effect(() => {
    setCookie(THEME_STORAGE_KEY, mode());
  });

  // ... rest of provider
}
```

## Custom Themes

### Multiple Themes

```typescript
const themes = {
  light: lightTheme,
  dark: darkTheme,
  ocean: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      primary: '#0077be',
      secondary: '#00a8e8',
      background: '#e6f3f7',
      surface: '#ffffff',
      text: '#003d5b'
    }
  },
  forest: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      primary: '#2d6a4f',
      secondary: '#52b788',
      background: '#d8f3dc',
      surface: '#ffffff',
      text: '#1b4332'
    }
  }
} as const;

type ThemeName = keyof typeof themes;

export function ThemeProvider({ children }: { children: any }) {
  const themeName = signal<ThemeName>('light');

  const theme = () => themes[themeName()];

  const setTheme = (name: ThemeName) => {
    themeName.set(name);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeSelector() {
  const { themeName, setTheme } = useTheme();

  return (
    <select
      value={themeName()}
      onChange={(e) => setTheme(e.target.value as ThemeName)}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="ocean">Ocean</option>
      <option value="forest">Forest</option>
    </select>
  );
}
```

### User-Defined Themes

```typescript
interface CustomTheme extends Theme {
  id: string;
  name: string;
}

export function ThemeProvider({ children }: { children: any }) {
  const customThemes = signal<CustomTheme[]>([]);
  const activeThemeId = signal<string>('light');

  const allThemes = () => [
    { id: 'light', name: 'Light', ...lightTheme },
    { id: 'dark', name: 'Dark', ...darkTheme },
    ...customThemes()
  ];

  const theme = () => {
    return allThemes().find((t) => t.id === activeThemeId()) || lightTheme;
  };

  const addCustomTheme = (theme: CustomTheme) => {
    customThemes.set([...customThemes(), theme]);
  };

  const removeCustomTheme = (id: string) => {
    customThemes.set(customThemes().filter((t) => t.id !== id));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        activeThemeId,
        setThemeId: activeThemeId.set,
        customThemes,
        addCustomTheme,
        removeCustomTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
```

## Animation and Transitions

### Smooth Theme Transitions

```typescript
import { effect } from '@philjs/core';

export function ThemeProvider({ children }: { children: any }) {
  const mode = signal<ThemeMode>('light');
  const theme = () => (mode() === 'light' ? lightTheme : darkTheme);

  effect(() => {
    // Add transition class
    document.documentElement.classList.add('theme-transition');

    // Apply theme
    const variables = themeToCSSVariables(theme());
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  });

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode: mode.set }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

```css
/* global.css */
.theme-transition,
.theme-transition *,
.theme-transition *::before,
.theme-transition *::after {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}
```

## Best Practices

### Type Your Themes

```typescript
// ✅ Strongly typed themes
interface Theme {
  colors: {
    primary: string;
    secondary: string;
  };
}

const theme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d'
  }
};

// ❌ Untyped themes
const theme = {
  colors: {
    primry: '#007bff' // Typo not caught
  }
};
```

### Use Semantic Naming

```typescript
// ✅ Semantic color names
colors: {
  primary: '#007bff',
  background: '#ffffff',
  text: '#212529',
  success: '#28a745',
  danger: '#dc3545'
}

// ❌ Non-semantic names
colors: {
  blue: '#007bff',
  white: '#ffffff',
  black: '#212529',
  green: '#28a745',
  red: '#dc3545'
}
```

### Provide Fallbacks

```typescript
// ✅ Fallback for missing theme values
const getColor = (theme: Theme | null, color: keyof Theme['colors']) => {
  return theme?.colors[color] || '#000000';
};

// ❌ No fallback (can break)
const getColor = (theme: Theme, color: keyof Theme['colors']) => {
  return theme.colors[color];
};
```

### Keep Themes Consistent

```typescript
// ✅ Ensure all themes have same shape
function validateTheme(theme: any): theme is Theme {
  return (
    theme.colors &&
    theme.spacing &&
    theme.typography &&
    theme.borderRadius &&
    theme.shadows
  );
}

// Use validation when adding custom themes
if (validateTheme(customTheme)) {
  addCustomTheme(customTheme);
}
```

## Summary

You've learned:

✅ Theme structure and organization
✅ Theme context and provider
✅ Dark mode implementation
✅ CSS variables integration
✅ Theme persistence
✅ Multiple and custom themes
✅ Smooth transitions
✅ Best practices

Theming enables flexible, maintainable styling systems!

---

**Next:** [Responsive Design →](./responsive.md) Build responsive layouts
