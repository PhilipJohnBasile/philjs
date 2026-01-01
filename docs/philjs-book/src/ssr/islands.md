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

## Choosing hydration strategies

- **Immediate**: for critical UI (nav, hero CTA).
- **Visible**: for below-the-fold charts/cards.
- **Idle**: for non-critical widgets (comments, recs).
- **On interaction**: for popovers/menus/editors; hydrate on first click.

Pick the lightest strategy that still feels instant for the user.

## Splitting islands

- Keep islands small and focused (e.g., a chart, a form, a menu).
- Co-locate island registration with components for clarity.
- Share signals across islands only when necessary; prefer route-level data for consistency.

## Data flow

- Pass loader data into islands as props; avoid re-fetching on hydration.
- If an island needs live data, use resources with cache tags to stay consistent with route data.

## Styling and assets

- Hydrate islands with minimal CSS; prefer scoped styles or critical CSS in first chunk.
- Lazy-load heavy assets (chart libs) inside the island on first render/interaction.

## Testing islands

- SSR test: `renderToString/Stream` to ensure HTML includes static shell.
- Client test: simulate hydration strategy (visible/interaction) and assert event handlers work.
- E2E: scroll to islands or click activators and ensure hydration occurs without console errors.

## Checklist

- [ ] Pick hydration strategy per island (immediate/visible/idle/interaction).
- [ ] Pass server data as props; avoid duplicate fetches.
- [ ] Lazy-load heavy deps inside islands.
- [ ] Test SSR + hydration + interactions.

## Try it now: interaction-hydrated menu

```tsx
import { registerIsland, autoHydrateIslands, HydrationStrategy } from '@philjs/ssr';

export function Menu() {
  const open = signal(false);
  return (
    <div>
      <button onClick={() => open.set(!open())}>Menu</button>
      {open() && <ul><li>Profile</li><li>Logout</li></ul>}
    </div>
  );
}

registerIsland('Menu', Menu);
autoHydrateIslands(HydrationStrategy.ON_INTERACTION);
```

The static HTML shows the button; the island hydrates on first click, keeping initial HTML small.
