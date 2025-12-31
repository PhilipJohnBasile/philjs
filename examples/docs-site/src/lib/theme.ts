import { signal, effect, onCleanup } from '@philjs/core';

export type Theme = 'light' | 'dark' | 'high-contrast';

// Get initial theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  // Check for high-contrast preference first
  if (window.matchMedia('(prefers-contrast: more)').matches) {
    return 'high-contrast';
  }

  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const theme = signal<Theme>(getInitialTheme());

// Apply theme to document
effect(() => {
  const currentTheme = theme();
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
});

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const contrastQuery = window.matchMedia('(prefers-contrast: more)');

  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      theme.set(e.matches ? 'dark' : 'light');
    }
  };

  const contrastHandler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      theme.set(e.matches ? 'high-contrast' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handler);
  contrastQuery.addEventListener('change', contrastHandler);
}

export const toggleTheme = () => {
  const current = theme();
  if (current === 'light') theme.set('dark');
  else if (current === 'dark') theme.set('high-contrast');
  else theme.set('light');
};
