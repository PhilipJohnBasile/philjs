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
