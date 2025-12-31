# Dark Mode Toggle

**Outcome**: Persist user's theme preference and apply it instantly.

## Solution

```typescript
import { signal, effect } from '@philjs/core';

// Initialize from localStorage or system preference
const getInitialTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const theme = signal(getInitialTheme());

// Apply theme to DOM and persist
effect(() => {
  const currentTheme = theme();
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
});

function ThemeToggle() {
  const toggleTheme = () => {
    theme.set(theme() === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme() === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme() === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

## CSS Setup

```css
:root {
  --color-bg: #ffffff;
  --color-text: #000000;
}

[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-text: #ffffff;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

## How it Works

1. Signal initializes from localStorage or system preference
2. Effect updates DOM attribute and persists to localStorage
3. CSS variables switch based on `data-theme` attribute
4. Toggle function flips between light and dark

## Pitfalls

- **Flash of wrong theme**: Load theme in `<head>` before render
- **Missing system preference**: Always provide fallback
- **localStorage unavailable**: Handle SSR and private browsing

## Production Tips

- Add `prefers-reduced-motion` support for animations
- Use `system` option for three-way toggle
- Prefetch alternate theme CSS
- Add transition for smooth color changes
