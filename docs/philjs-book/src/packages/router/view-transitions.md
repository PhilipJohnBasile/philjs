# View transitions

View transitions provide seamless page changes and shared element animations.

## Basic usage

```tsx
import { ViewTransitionLink } from '@philjs/router';

<ViewTransitionLink href="/pricing">
  Pricing
</ViewTransitionLink>
```

## Programmatic navigation

```ts
import { navigateWithTransition } from '@philjs/router';

await navigateWithTransition('/checkout', {
  transitionName: 'fade'
});
```

## Shared elements

```tsx
import { markSharedElement } from '@philjs/router';

<img src={product.image} ref={el => markSharedElement(el, 'product-image')} />
```

## Support checks

```ts
import { supportsViewTransitions } from '@philjs/router';

if (supportsViewTransitions()) {
  // enable enhanced transitions
}
```

## Notes

- Use `prefersReducedMotion` to honor user settings.
- Fallback transitions are provided when the API is unavailable.
