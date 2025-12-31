# Islands

Islands let you hydrate only the parts of the page that need interactivity.

## Server Render

```tsx
import { Island } from "@philjs/islands";

export function Product({ data }) {
  return (
    <div>
      <h1>{data.title}</h1>
      <Island name="AddToCart" props={{ id: data.id }}>
        <add-to-cart-island data-id={data.id} />
      </Island>
    </div>
  );
}
```

## Client Hydration

```tsx
import { hydrateIslands } from "@philjs/islands";
import { AddToCart } from "./islands/AddToCart";

hydrateIslands({ AddToCart }, { strategy: "visible" });
```
