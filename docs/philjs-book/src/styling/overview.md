# Styling Options

PhilJS works with standard CSS and modern tooling.

## CSS Modules

```tsx
import styles from "./Card.module.css";

export function Card() {
  return <div class={styles.card}>Card</div>;
}
```

## Tailwind

Use the Tailwind preset from `@philjs/tailwind` and standard utility classes.

```tsx
export function Button() {
  return <button class="px-4 py-2 rounded bg-black text-white">Save</button>;
}
```
