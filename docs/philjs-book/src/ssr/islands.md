# Islands

Islands let you hydrate only the interactive parts of a page.

## Mark interactive components

```tsx
import { renderToStream } from "@philjs/ssr";
import { Counter } from "./Counter";

const stream = renderToStream(<App />, {
  interactiveComponents: new Set([Counter]),
});
```

## Hydrate on the client

```tsx
import { autoHydrateIslands, HydrationStrategy, registerIsland } from "@philjs/ssr";
import { Counter } from "./Counter";

registerIsland("Counter", Counter);
autoHydrateIslands(HydrationStrategy.VISIBLE);
```

## Common patterns

- Hydrate on visibility for heavy widgets
- Hydrate on interaction for menus or editors
- Keep most content static for fast first paint
