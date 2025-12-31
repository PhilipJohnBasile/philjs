# Components

Components are TypeScript functions that return JSX.

## Basic Component

```tsx
type GreetingProps = { name: string };

export function Greeting({ name }: GreetingProps) {
  return <p>Hello {name}</p>;
}
```

## Children

```tsx
import type { JSX } from "@philjs/core";

type CardProps = {
  title: string;
  children: JSX.Element;
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
      <p>Signals, SSR, and islands.</p>
    </Card>
  );
}
```
