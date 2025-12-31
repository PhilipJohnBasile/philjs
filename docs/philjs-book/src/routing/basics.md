# Routing

PhilJS uses file-based routing by default.

```
src/routes/
├── index.tsx
├── about.tsx
└── blog/
    └── [slug].tsx
```

## Link Component

```tsx
import { Link } from "@philjs/router";

export function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
    </nav>
  );
}
```
