# JSX Basics

PhilJS uses JSX with standard TypeScript tooling.

```tsx
export function Hero() {
  return (
    <section class="hero">
      <h1>PhilJS</h1>
      <p>Signals-first UI for 2026.</p>
    </section>
  );
}
```

## Dynamic Attributes

```tsx
const active = signal(true);

<button class={active() ? "btn active" : "btn"}>
  Toggle
</button>
```

## Inline Styles

```tsx
const size = signal(18);

<p style={{ fontSize: `${size()}px` }}>Resizable</p>
```
