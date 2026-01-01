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

## Fragments and arrays

Return fragments or arrays to avoid extra wrapper DOM:

```tsx
export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, i) => (
        <span key={item}>
          {item}
          {i < items.length - 1 ? " / " : ""}
        </span>
      ))}
    </>
  );
}
```

## Controlled vs uncontrolled

- Controlled inputs bind `value` to signals.
- Uncontrolled inputs use `defaultValue` and refs; better for large forms when you don’t need every keystroke.

```tsx
const name = signal("");
<input value={name()} onInput={(ev) => name.set((ev.target as HTMLInputElement).value)} />;
```

## Accessibility first

- Use semantic elements (`button`, `nav`, `main`).
- Add `aria-*` labels when semantics aren’t enough.
- Use `for`/`id` pairs for form controls; leverage role-based queries in tests.

## TypeScript helpers

- `JSX.Element` and `JSXChild` from `@philjs/core` help type children and components.
- Use `ComponentProps<"button">` when forwarding native props.

```tsx
type ButtonProps = ComponentProps<"button"> & { tone?: "primary" | "ghost" };
```

## Patterns to avoid

- Mutating props.
- Creating new functions/objects in render when not needed (pull them up or memoize).
- Heavy logic in JSX expressions; precompute with memos.

## Try it now: accessible button with forwarded props

```tsx
import type { ComponentProps } from '@philjs/core';

type ButtonProps = ComponentProps<'button'> & { tone?: 'primary' | 'ghost' };
export function Button({ tone = 'primary', ...rest }: ButtonProps) {
  return (
    <button
      class={`btn btn-${tone}`}
      {...rest}
    />
  );
}
```

Use in tests with `getByRole('button', { name: /submit/i })` to keep a11y baked in.
