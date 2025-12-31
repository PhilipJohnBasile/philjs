# JSX Basics

PhilJS uses JSX with a custom runtime. Configure TypeScript to use `@philjs/core`.

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core"
  }
}
```

## Elements and props

```tsx
export function Hero() {
  return (
    <header class="hero" aria-label="Landing hero">
      <h1>Build faster with PhilJS</h1>
      <p>Signals-first UI with streaming SSR.</p>
    </header>
  );
}
```

## Styling with objects

```tsx
import type { CSSProperties } from "@philjs/core";

const panelStyle: CSSProperties = {
  padding: "1.5rem",
  borderRadius: "12px",
  background: "#0f172a",
  color: "#e2e8f0",
};

export function Panel() {
  return <section style={panelStyle}>Panel content</section>;
}
```

## Reactive attributes

```tsx
import { signal } from "@philjs/core";

const selected = signal(false);

export function Toggle() {
  return (
    <button class={() => (selected() ? "on" : "off")} onClick={() => selected.set(!selected())}>
      {() => (selected() ? "On" : "Off")}
    </button>
  );
}
```
