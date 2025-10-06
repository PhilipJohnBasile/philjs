import { signal, effect, onCleanup } from 'philjs-core';

export type Theme = 'light' | 'dark';

// Get initial theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
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
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      theme.set(e.matches ? 'dark' : 'light');
    }
  };
  mediaQuery.addEventListener('change', handler);
}

export const toggleTheme = () => {
  theme.set(theme() === 'light' ? 'dark' : 'light');
};
