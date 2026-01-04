# View Transitions

The `@philjs/router` package provides Astro-style view transitions for smooth, animated page changes with shared element animations.

## Overview

View transitions enable:
- Smooth page-to-page animations
- Shared element transitions (morphing elements between pages)
- Cross-fade and slide effects
- Direction-aware animations
- Reduced motion support
- Fallback for unsupported browsers

## Browser Support

View transitions use the native View Transitions API where available:

```tsx
import { supportsViewTransitions, prefersReducedMotion } from '@philjs/router';

if (supportsViewTransitions()) {
  // Native View Transitions API available
  console.log('Using native transitions');
} else {
  // Fallback transitions will be used
  console.log('Using fallback transitions');
}

if (prefersReducedMotion()) {
  // User prefers reduced motion
  console.log('Reduced motion enabled');
}
```

## Basic Usage

### ViewTransitionLink

Navigate with view transitions:

```tsx
import { ViewTransitionLink } from '@philjs/router';

function Navigation() {
  return (
    <nav>
      <ViewTransitionLink href="/home">Home</ViewTransitionLink>
      <ViewTransitionLink href="/about">About</ViewTransitionLink>
      <ViewTransitionLink href="/products">Products</ViewTransitionLink>
    </nav>
  );
}
```

### Programmatic Navigation

```tsx
import { navigateWithTransition } from '@philjs/router';

function Component() {
  const handleClick = async () => {
    await navigateWithTransition('/dashboard', {
      transitionName: 'slide',
      direction: 'forward'
    });
  };

  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

## Initialization

Configure view transitions globally:

```tsx
import { initViewTransitions } from '@philjs/router';

initViewTransitions({
  // Default transition type
  defaultTransition: 'fade', // 'fade' | 'slide' | 'scale' | 'none'

  // Animation duration in ms
  duration: 300,

  // Easing function
  easing: 'ease-in-out',

  // Honor prefers-reduced-motion
  respectReducedMotion: true,

  // Custom fallback for unsupported browsers
  fallbackBehavior: 'animate', // 'animate' | 'instant' | 'none'
});
```

## Transition Types

### Fade Transition

Cross-fade between pages:

```tsx
<ViewTransitionLink href="/page" transition="fade">
  Fade to Page
</ViewTransitionLink>

// Programmatic
navigateWithTransition('/page', { transitionName: 'fade' });
```

### Slide Transition

Slide pages left/right:

```tsx
<ViewTransitionLink href="/next" transition="slide">
  Slide to Next
</ViewTransitionLink>

// With direction
navigateWithTransition('/next', {
  transitionName: 'slide',
  direction: 'forward'  // 'forward' | 'backward'
});

navigateWithTransition('/previous', {
  transitionName: 'slide',
  direction: 'backward'
});
```

### Scale Transition

Scale in/out:

```tsx
<ViewTransitionLink href="/detail" transition="scale">
  Scale to Detail
</ViewTransitionLink>
```

### Custom Transition

Define custom CSS transitions:

```tsx
import { registerTransition } from '@philjs/router';

registerTransition('flip', {
  old: {
    animation: 'flip-out 0.4s ease-in-out forwards'
  },
  new: {
    animation: 'flip-in 0.4s ease-in-out forwards'
  }
});

// CSS
@keyframes flip-out {
  from { transform: perspective(1000px) rotateY(0); }
  to { transform: perspective(1000px) rotateY(-90deg); opacity: 0; }
}

@keyframes flip-in {
  from { transform: perspective(1000px) rotateY(90deg); opacity: 0; }
  to { transform: perspective(1000px) rotateY(0); }
}

// Use custom transition
<ViewTransitionLink href="/page" transition="flip">
  Flip to Page
</ViewTransitionLink>
```

## Shared Element Transitions

Morph elements smoothly between pages.

### markSharedElement

Mark an element for shared element transition:

```tsx
import { markSharedElement } from '@philjs/router';

// Product list page
function ProductCard({ product }) {
  return (
    <ViewTransitionLink href={`/products/${product.id}`}>
      <img
        src={product.image}
        alt={product.name}
        {...markSharedElement(`product-image-${product.id}`)}
      />
      <h3
        {...markSharedElement(`product-title-${product.id}`)}
      >
        {product.name}
      </h3>
    </ViewTransitionLink>
  );
}

// Product detail page
function ProductDetail({ product }) {
  return (
    <div>
      <img
        src={product.image}
        alt={product.name}
        {...markSharedElement(`product-image-${product.id}`)}
      />
      <h1
        {...markSharedElement(`product-title-${product.id}`)}
      >
        {product.name}
      </h1>
      <p>{product.description}</p>
    </div>
  );
}
```

### Shared Element Configuration

```tsx
markSharedElement('element-id', {
  // Animation duration for this element
  duration: 400,

  // Easing function
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Whether to animate size changes
  animateSize: true,

  // Custom animation name
  animation: 'morph'
});
```

## useViewTransition Hook

Access transition state in components:

```tsx
import { useViewTransition } from '@philjs/router';

function AnimatedPage() {
  const {
    isTransitioning,
    direction,
    transitionName,
    progress
  } = useViewTransition();

  return (
    <div
      class={`page ${isTransitioning ? 'transitioning' : ''}`}
      style={{ opacity: isTransitioning ? 1 - progress : 1 }}
    >
      {direction === 'forward' ? 'Going forward' : 'Going backward'}
    </div>
  );
}
```

### Transition State

```tsx
type ViewTransitionState = {
  /** Whether a transition is in progress */
  isTransitioning: boolean;

  /** Navigation direction */
  direction: 'forward' | 'backward' | null;

  /** Current transition name */
  transitionName: string | null;

  /** Transition progress (0-1) */
  progress: number;

  /** Source path */
  from: string | null;

  /** Destination path */
  to: string | null;
};
```

## Direction-Aware Transitions

Automatically determine animation direction based on navigation:

```tsx
import { initViewTransitions, setTransitionDirection } from '@philjs/router';

// Automatic direction based on history
initViewTransitions({
  defaultTransition: 'slide',
  autoDetectDirection: true
});

// Manual direction control
function NavigationControls() {
  const goBack = () => {
    setTransitionDirection('backward');
    history.back();
  };

  const goForward = () => {
    setTransitionDirection('forward');
    history.forward();
  };

  return (
    <div>
      <button onClick={goBack}>Back</button>
      <button onClick={goForward}>Forward</button>
    </div>
  );
}
```

## Route-Specific Transitions

Define transitions per route:

```tsx
// In route definition
const routes = [
  {
    path: '/gallery',
    component: Gallery,
    meta: {
      transition: 'fade',
      transitionDuration: 400
    }
  },
  {
    path: '/gallery/:id',
    component: GalleryDetail,
    meta: {
      transition: 'scale',
      transitionDuration: 300
    }
  }
];

// Access in navigation
beforeEach((to, from) => {
  if (to.meta?.transition) {
    setTransitionConfig({
      name: to.meta.transition,
      duration: to.meta.transitionDuration
    });
  }
  return true;
});
```

## Reduced Motion Support

Respect user preferences:

```tsx
import {
  prefersReducedMotion,
  setReducedMotionBehavior
} from '@philjs/router';

// Check user preference
if (prefersReducedMotion()) {
  // Disable or simplify animations
  setReducedMotionBehavior('instant'); // 'instant' | 'fade-only' | 'none'
}

// In CSS
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

## CSS Customization

### Default Transition Styles

```css
/* Fade transition */
::view-transition-old(root) {
  animation: fade-out 0.3s ease-in-out;
}

::view-transition-new(root) {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Slide Transition Styles

```css
/* Slide forward */
::view-transition-old(root).slide-forward {
  animation: slide-out-left 0.3s ease-in-out;
}

::view-transition-new(root).slide-forward {
  animation: slide-in-right 0.3s ease-in-out;
}

/* Slide backward */
::view-transition-old(root).slide-backward {
  animation: slide-out-right 0.3s ease-in-out;
}

::view-transition-new(root).slide-backward {
  animation: slide-in-left 0.3s ease-in-out;
}

@keyframes slide-out-left {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slide-out-right {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

@keyframes slide-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

### Shared Element Styles

```css
/* Named shared elements */
::view-transition-group(product-image) {
  animation-duration: 0.4s;
}

::view-transition-old(product-image),
::view-transition-new(product-image) {
  animation: none;
  mix-blend-mode: normal;
}
```

## Transition Events

Listen to transition lifecycle:

```tsx
import {
  onTransitionStart,
  onTransitionEnd,
  onTransitionCancel
} from '@philjs/router';

onTransitionStart((event) => {
  console.log('Transition started:', event.from, '->', event.to);
});

onTransitionEnd((event) => {
  console.log('Transition completed:', event.duration, 'ms');
});

onTransitionCancel((event) => {
  console.log('Transition cancelled:', event.reason);
});
```

## Complete Example

```tsx
import {
  initViewTransitions,
  ViewTransitionLink,
  navigateWithTransition,
  markSharedElement,
  useViewTransition
} from '@philjs/router';

// Initialize
initViewTransitions({
  defaultTransition: 'fade',
  duration: 300,
  respectReducedMotion: true
});

// Product list page
function ProductList({ products }) {
  return (
    <div class="product-grid">
      {products.map(product => (
        <ViewTransitionLink
          href={`/products/${product.id}`}
          transition="scale"
        >
          <article class="product-card">
            <img
              src={product.image}
              {...markSharedElement(`product-${product.id}-image`)}
            />
            <h2 {...markSharedElement(`product-${product.id}-title`)}>
              {product.name}
            </h2>
            <p>{product.price}</p>
          </article>
        </ViewTransitionLink>
      ))}
    </div>
  );
}

// Product detail page
function ProductDetail({ product }) {
  const { isTransitioning } = useViewTransition();

  return (
    <article class={`product-detail ${isTransitioning ? 'entering' : ''}`}>
      <img
        src={product.image}
        {...markSharedElement(`product-${product.id}-image`)}
      />
      <div class="details">
        <h1 {...markSharedElement(`product-${product.id}-title`)}>
          {product.name}
        </h1>
        <p class="price">{product.price}</p>
        <p class="description">{product.description}</p>
        <button onClick={() => addToCart(product)}>
          Add to Cart
        </button>
      </div>
    </article>
  );
}

// Navigation with transitions
function Header() {
  return (
    <header>
      <ViewTransitionLink href="/" transition="fade">
        Home
      </ViewTransitionLink>
      <ViewTransitionLink href="/products" transition="slide">
        Products
      </ViewTransitionLink>
      <ViewTransitionLink href="/about" transition="fade">
        About
      </ViewTransitionLink>
    </header>
  );
}
```

## API Reference

### Initialization

| Function | Description |
|----------|-------------|
| `initViewTransitions(config)` | Initialize with global config |
| `registerTransition(name, styles)` | Register custom transition |

### Navigation

| Function | Description |
|----------|-------------|
| `navigateWithTransition(path, options)` | Navigate with transition |
| `setTransitionDirection(direction)` | Set next transition direction |
| `setTransitionConfig(config)` | Override transition config |

### Components

| Component | Description |
|-----------|-------------|
| `ViewTransitionLink` | Link with view transition |

### Hooks

| Hook | Description |
|------|-------------|
| `useViewTransition()` | Access transition state |

### Shared Elements

| Function | Description |
|----------|-------------|
| `markSharedElement(id, options?)` | Mark element for shared transition |

### Utilities

| Function | Description |
|----------|-------------|
| `supportsViewTransitions()` | Check browser support |
| `prefersReducedMotion()` | Check reduced motion preference |
| `setReducedMotionBehavior(behavior)` | Set reduced motion behavior |

### Events

| Function | Description |
|----------|-------------|
| `onTransitionStart(callback)` | Listen to transition start |
| `onTransitionEnd(callback)` | Listen to transition end |
| `onTransitionCancel(callback)` | Listen to transition cancel |

## Next Steps

- [Smart Preloading](./smart-preloading.md) - Preload routes for instant transitions
- [Route Masking](./route-masking.md) - Mask URLs for modal transitions
- [Parallel Routes](./parallel-routes.md) - Animate slot changes
