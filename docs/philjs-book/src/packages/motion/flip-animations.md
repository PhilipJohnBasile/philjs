# FLIP Layout Animations

FLIP (First, Last, Invert, Play) is a powerful technique for animating layout changes. `@philjs/motion` provides a spring-physics-powered FLIP system that makes complex layout animations smooth and easy to implement.

## What is FLIP?

FLIP animations solve a fundamental challenge: CSS can't animate layout properties (like `width`, `height`, `top`, `left`) efficiently. FLIP works around this by:

1. **First**: Record the element's starting position
2. **Last**: Let the DOM change to its final state
3. **Invert**: Apply transforms to make it look like it's in the old position
4. **Play**: Animate the transforms back to zero (the new position)

This approach uses GPU-accelerated transforms instead of expensive layout calculations.

## FlipAnimation Class

### Basic Usage

```typescript
import { FlipAnimation, SpringPresets } from '@philjs/motion';

const element = document.getElementById('card');

// Create FLIP animator
const flip = new FlipAnimation(element, SpringPresets.snappy);

// 1. Record current position (First)
flip.first();

// 2. Make DOM changes that affect layout (Last)
element.classList.toggle('expanded');

// 3. Animate from old position to new (Invert + Play)
await flip.play();
```

### How It Works

```typescript
const flip = new FlipAnimation(element);

// first() captures the element's bounding rect
flip.first();
// Stores: { x: 100, y: 50, width: 200, height: 150 }

// After DOM change, last() gets new position
// New rect: { x: 200, y: 100, width: 400, height: 300 }

// invert() calculates the transform needed
const invert = flip.invert();
// Returns: { x: -100, y: -50, scaleX: 0.5, scaleY: 0.5 }

// play() applies transforms and animates to identity
await flip.play();
```

## Common Use Cases

### Expanding Cards

```typescript
import { FlipAnimation, SpringPresets } from '@philjs/motion';

function toggleCardExpansion(card: HTMLElement) {
  const flip = new FlipAnimation(card, SpringPresets.snappy);

  // Capture starting position
  flip.first();

  // Toggle expanded state (CSS changes size/position)
  card.classList.toggle('expanded');

  // Animate the transition
  return flip.play();
}

// CSS:
// .card { width: 200px; height: 150px; }
// .card.expanded { width: 100%; height: 400px; position: fixed; top: 0; }
```

### Grid Item Reordering

```typescript
function reorderGrid(items: HTMLElement[], newOrder: number[]) {
  // Capture all positions
  const flips = items.map(item => {
    const flip = new FlipAnimation(item, SpringPresets.bouncy);
    flip.first();
    return flip;
  });

  // Reorder DOM
  const parent = items[0].parentElement!;
  newOrder.forEach(index => {
    parent.appendChild(items[index]);
  });

  // Animate all items to new positions
  return Promise.all(flips.map(flip => flip.play()));
}
```

### Shared Element Transitions

```typescript
function sharedElementTransition(source: HTMLElement, target: HTMLElement) {
  const flip = new FlipAnimation(target, SpringPresets.gentle);

  // Use source's position as "first"
  const sourceRect = source.getBoundingClientRect();
  (flip as any).firstRect = {
    x: sourceRect.left,
    y: sourceRect.top,
    width: sourceRect.width,
    height: sourceRect.height,
  };

  // Target is already in final position
  // Animate from source position to target
  return flip.play();
}
```

### List Item Deletion

```typescript
async function deleteListItem(item: HTMLElement, siblings: HTMLElement[]) {
  // Capture positions of all siblings
  const flips = siblings.map(sibling => {
    const flip = new FlipAnimation(sibling, SpringPresets.stiff);
    flip.first();
    return flip;
  });

  // Fade out and remove the item
  item.style.opacity = '0';
  await new Promise(r => setTimeout(r, 200));
  item.remove();

  // Animate siblings to new positions
  await Promise.all(flips.map(flip => flip.play()));
}
```

### Accordion Animation

```typescript
function animateAccordion(accordion: HTMLElement) {
  const content = accordion.querySelector('.content') as HTMLElement;
  const flip = new FlipAnimation(content, SpringPresets.snappy);

  // Capture current state
  flip.first();

  // Toggle expansion
  accordion.classList.toggle('open');

  // Animate the change
  return flip.play();
}
```

## Advanced Techniques

### Custom Spring Configuration

```typescript
// Bouncy expansion
const bouncyFlip = new FlipAnimation(element, {
  tension: 600,
  friction: 15,
});

// Smooth, professional transition
const smoothFlip = new FlipAnimation(element, {
  tension: 200,
  friction: 40,
  clamp: true, // No overshoot
});

// Slow, deliberate animation
const slowFlip = new FlipAnimation(element, SpringPresets.molasses);
```

### Nested FLIP Animations

```typescript
function animateNestedLayout(parent: HTMLElement, children: HTMLElement[]) {
  // Capture parent
  const parentFlip = new FlipAnimation(parent, SpringPresets.stiff);
  parentFlip.first();

  // Capture children
  const childFlips = children.map(child => {
    const flip = new FlipAnimation(child, SpringPresets.bouncy);
    flip.first();
    return flip;
  });

  // Make DOM changes
  parent.classList.toggle('layout-changed');

  // Animate parent first, then children
  await parentFlip.play();
  await Promise.all(childFlips.map(flip => flip.play()));
}
```

### FLIP with Opacity

```typescript
async function flipWithFade(element: HTMLElement) {
  const flip = new FlipAnimation(element, SpringPresets.snappy);
  flip.first();

  // Make DOM changes
  element.classList.toggle('expanded');

  // Fade out before FLIP
  element.style.opacity = '0.5';

  // Play FLIP animation
  const animation = flip.play();

  // Fade in during FLIP
  element.style.transition = 'opacity 200ms';
  element.style.opacity = '1';

  await animation;
  element.style.transition = '';
}
```

### Staggered FLIP Animations

```typescript
async function staggeredFlip(items: HTMLElement[], staggerMs: number = 50) {
  // Capture all positions
  const flips = items.map(item => {
    const flip = new FlipAnimation(item, SpringPresets.bouncy);
    flip.first();
    return flip;
  });

  // Make DOM changes
  items.forEach(item => item.classList.toggle('rearranged'));

  // Stagger the animations
  const promises = flips.map((flip, index) => {
    return new Promise<void>(resolve => {
      setTimeout(async () => {
        await flip.play();
        resolve();
      }, index * staggerMs);
    });
  });

  return Promise.all(promises);
}
```

## React Hook: useFlip

```typescript
import { useFlip } from '@philjs/motion';
import { useRef, useState } from 'preact/hooks';

function ExpandableCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { snapshot, animate } = useFlip(ref, SpringPresets.snappy);
  const [expanded, setExpanded] = useState(false);

  const toggle = async () => {
    // Capture current position
    snapshot();

    // Update state (triggers re-render with new layout)
    setExpanded(!expanded);

    // Wait for DOM update, then animate
    requestAnimationFrame(() => {
      animate();
    });
  };

  return (
    <div
      ref={ref}
      class={expanded ? 'card expanded' : 'card'}
      onClick={toggle}
    >
      <h2>Click to {expanded ? 'collapse' : 'expand'}</h2>
      {expanded && <p>Additional content when expanded...</p>}
    </div>
  );
}
```

### useFlip with Lists

```typescript
function ReorderableList({ items, onReorder }) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const flips = useRef<Map<string, { snapshot: () => void; animate: () => void }>>(new Map());

  // Create flip handlers for each item
  items.forEach(item => {
    const ref = itemRefs.current.get(item.id);
    if (ref && !flips.current.has(item.id)) {
      flips.current.set(item.id, useFlip({ current: ref }));
    }
  });

  const handleReorder = async (newOrder: string[]) => {
    // Snapshot all positions
    flips.current.forEach(flip => flip.snapshot());

    // Update order
    onReorder(newOrder);

    // Animate all items
    requestAnimationFrame(() => {
      flips.current.forEach(flip => flip.animate());
    });
  };

  return (
    <ul>
      {items.map(item => (
        <li
          key={item.id}
          ref={el => itemRefs.current.set(item.id, el)}
        >
          {item.content}
        </li>
      ))}
    </ul>
  );
}
```

## Performance Considerations

### Transform-Only Animations

FLIP animations only use `transform` and `opacity`, which are GPU-accelerated:

```typescript
// FLIP internally uses translate3d and scale
element.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${sx}) scaleY(${sy})`;
```

### Will-Change Optimization

FlipAnimation automatically sets `will-change` for optimal performance:

```typescript
// Applied during animation
element.style.willChange = 'transform, opacity';

// Cleaned up after animation
element.style.willChange = '';
```

### Batch DOM Reads/Writes

When animating multiple elements, batch your operations:

```typescript
// Good: Batch reads, then batch writes
function goodFlipBatch(items: HTMLElement[]) {
  // All reads first
  const flips = items.map(item => {
    const flip = new FlipAnimation(item);
    flip.first(); // Read operation
    return flip;
  });

  // All writes
  items.forEach(item => item.classList.toggle('changed'));

  // All animations
  return Promise.all(flips.map(flip => flip.play()));
}

// Bad: Interleaved reads/writes (causes layout thrashing)
async function badFlipBatch(items: HTMLElement[]) {
  for (const item of items) {
    const flip = new FlipAnimation(item);
    flip.first();               // Read
    item.classList.toggle('changed'); // Write - forces layout!
    await flip.play();
  }
}
```

### Avoid During Animation

Don't trigger layout changes during FLIP animations:

```typescript
// Bad: Modifying layout during animation
flip.play();
element.style.width = '300px'; // Interrupts animation!

// Good: Wait for animation to complete
await flip.play();
element.style.width = '300px';
```

## Debugging FLIP Animations

### Visualizing FLIP Steps

```typescript
function debugFlip(element: HTMLElement) {
  const flip = new FlipAnimation(element);

  flip.first();
  console.log('First rect:', { ...flip['firstRect'] });

  element.classList.toggle('changed');

  const lastRect = flip.last();
  console.log('Last rect:', lastRect);

  const invert = flip.invert();
  console.log('Invert:', invert);

  // Visual debugging - show ghost element
  const ghost = element.cloneNode(true) as HTMLElement;
  ghost.style.position = 'fixed';
  ghost.style.top = `${flip['firstRect'].y}px`;
  ghost.style.left = `${flip['firstRect'].x}px`;
  ghost.style.width = `${flip['firstRect'].width}px`;
  ghost.style.height = `${flip['firstRect'].height}px`;
  ghost.style.opacity = '0.5';
  ghost.style.pointerEvents = 'none';
  ghost.style.border = '2px dashed red';
  document.body.appendChild(ghost);

  setTimeout(() => ghost.remove(), 2000);

  return flip.play();
}
```

## Common Pitfalls

### 1. Forgetting to Call first()

```typescript
// Wrong: No first() call
const flip = new FlipAnimation(element);
element.classList.toggle('changed');
await flip.play(); // Won't animate - no starting position!

// Correct
const flip = new FlipAnimation(element);
flip.first();
element.classList.toggle('changed');
await flip.play();
```

### 2. Calling play() Before DOM Updates

```typescript
// Wrong: play() before DOM change
flip.first();
await flip.play(); // Nothing to animate yet!
element.classList.toggle('changed');

// Correct: DOM change between first() and play()
flip.first();
element.classList.toggle('changed');
await flip.play();
```

### 3. Animating Hidden Elements

```typescript
// Elements must be visible for getBoundingClientRect() to work
element.style.display = 'block';
flip.first();
// ... changes
await flip.play();
```

### 4. Not Waiting for Animation

```typescript
// Wrong: Not awaiting animation
flip.first();
element.classList.toggle('changed');
flip.play(); // Fire and forget
element.classList.add('another-class'); // May interfere!

// Correct
flip.first();
element.classList.toggle('changed');
await flip.play();
element.classList.add('another-class'); // Safe now
```

## Comparison with CSS Transitions

| Feature | CSS Transitions | FLIP with @philjs/motion |
|---------|-----------------|--------------------------|
| Layout properties | Slow, janky | Smooth (transform-based) |
| Physics-based | No | Yes (spring physics) |
| Interruptible | Awkward | Natural |
| Cross-element | No | Yes |
| Programmatic control | Limited | Full |
| Performance | Variable | Consistent 60fps |

## Next Steps

- [Spring Physics Deep Dive](./spring-physics.md)
- [Gesture-Driven Animations](./gestures.md)
- [Scroll-Linked Animations](./scroll-animations.md)
- [Animation Sequences](./sequences.md)
