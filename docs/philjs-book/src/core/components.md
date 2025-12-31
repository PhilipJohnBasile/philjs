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
