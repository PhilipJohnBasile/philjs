# Styling Options

PhilJS works with vanilla CSS, CSS modules, and first-party styling utilities.

## CSS modules

```tsx
import styles from "./Button.module.css";

export function Button({ children }: { children: string }) {
  return <button class={styles.button}>{children}</button>;
}
```

## Scoped styles

```tsx
import { css } from "@philjs/styles/scoped";

export function Notice({ message }: { message: string }) {
  const styles = css`
    .notice {
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 12px;
    }
  `;

  return (
    <div class="notice">
      <style>{styles}</style>
      {message}
    </div>
  );
}
```

## CSS-in-JS

```tsx
import { styled } from "@philjs/styles/css-in-js";

const Button = styled("button", {
  base: { padding: "0.5rem 1rem", borderRadius: "999px" },
  variants: {
    tone: {
      primary: { background: "#2563eb", color: "#fff" },
      neutral: { background: "#e2e8f0", color: "#0f172a" },
    },
  },
});
```

## Design tokens and theming

- Define tokens once (colors, spacing, typography) and expose via CSS variables.
- Support light/dark by swapping token sets at the root.

```css
:root {
  --color-bg: #0b1021;
  --color-fg: #e2e8f0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
}
[data-theme="light"] {
  --color-bg: #f8fafc;
  --color-fg: #0f172a;
}
```

Apply in components:

```tsx
export function Panel({ children }) {
  return <section style={{ background: "var(--color-bg)", color: "var(--color-fg)", padding: "var(--space-3)" }}>{children}</section>;
}
```

## Tailwind adapter

Use `philjs-plugin-tailwind` to integrate Tailwind with zero extra glue:

```ts
// vite.config.ts
import tailwind from 'philjs-plugin-tailwind';

export default defineConfig({
  plugins: [philjs(), tailwind()]
});
```

Keep Tailwind for utility density; layer tokens on top for theming consistency.

## Tokens reference

See [Design Tokens](./tokens.md) for a shared vocabulary across components and themes.

## Styling performance

- Prefer static class names where possible; avoid recomputing style objects on every render.
- Scope CSS for islands to avoid global leaks.
- Defer non-critical CSS with `media`/`prefetch` or use critical CSS in SSR stream for above-the-fold.

## Accessibility

- Respect prefers-reduced-motion; disable heavy animations for that preference.
- Ensure color contrast meets WCAG; bake contrast checks into design tokens.
- Keep focus outlines; use `:focus-visible` for sensible defaults.

## Testing styles

- Snapshot minimal pieces (class presence) but assert behavior via roles/visibility.
- Use Playwright visual diffs sparingly for critical components.

## Checklist

- [ ] Tokens defined and applied via CSS variables.
- [ ] Light/dark theme switching without layout shift.
- [ ] Tailwind (if used) configured via `philjs-plugin-tailwind`.
- [ ] Critical CSS inlined for above-the-fold; rest deferred.
- [ ] prefers-reduced-motion respected.

## Try it now: theme toggle

```tsx
import { signal } from '@philjs/core';

const theme = signal<'light' | 'dark'>('dark');
function toggle() { theme.update(t => (t === 'dark' ? 'light' : 'dark')); }

export function ThemeToggle() {
  return (
    <button onClick={toggle}>
      Switch to {theme() === 'dark' ? 'light' : 'dark'}
    </button>
  );
}
```

Set `data-theme={theme()}` on your root element and watch tokens swap without repainting layout.
