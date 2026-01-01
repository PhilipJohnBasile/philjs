# Components

Components are TypeScript functions that return JSX. They are plain functions, easy to test, and trivial to compose.

## Typed props

```tsx
type GreetingProps = { name: string };

export function Greeting({ name }: GreetingProps) {
  return <p>Hello {name}</p>;
}
```

## Children

```tsx
import type { JSXChild } from "@philjs/core";

type CardProps = {
  title: string;
  children?: JSXChild;
};

export function Card({ title, children }: CardProps) {
  return (
    <section class="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
```

## Composition

```tsx
export function Page() {
  return (
    <Card title="Summary">
      <p>Signals, SSR, and islands in one system.</p>
    </Card>
  );
}
```

## Default values

```tsx
type BadgeProps = { tone?: "primary" | "neutral" };

export function Badge({ tone = "primary" }: BadgeProps) {
  return <span class={`badge badge-${tone}`}>{tone}</span>;
}
```

## Events and handlers

Event handlers receive native events; keep them small and avoid inline heavy allocations.

```tsx
export function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <input
      type="search"
      onInput={(ev) => onSearch((ev.target as HTMLInputElement).value)}
      placeholder="Search…"
    />
  );
}
```

## Refs and lifecycle

Use `ref` callbacks for DOM access; pair with `onCleanup` for listeners.

```tsx
import { onCleanup } from '@philjs/core';

export function Focusable() {
  let el: HTMLButtonElement | null = null;
  onCleanup(() => el?.removeEventListener('click', () => {}));
  return <button ref={(node) => (el = node)}>Click</button>;
}
```

## Composition patterns

- **Slots**: accept `children` and optional named slots as props.
- **Render props**: pass functions for dynamic content.
- **Headless components**: expose state via signals and render via `children`.

```tsx
export function Dialog({ open, children }: { open: boolean; children: JSXChild }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

## Performance

- Keep props serializable for SSR; avoid passing giant objects unless memoized.
- Extract heavy computations into memos/resources outside render.
- Use lists with stable keys to prevent unnecessary DOM churn.

## Testing components

- Render with `@philjs/testing` and assert via roles/labels.
- Avoid snapshotting entire trees; test behavior (text, aria, navigation).
- Mock only boundaries (network/storage); keep component logic real.

## Checklist

- [ ] Props typed; defaults set for optional props.
- [ ] Children handled safely (null/undefined allowed).
- [ ] Event handlers lean; avoid re-binding heavy functions per render.
- [ ] Refs cleaned up if adding listeners.
- [ ] Tested with realistic interactions.
