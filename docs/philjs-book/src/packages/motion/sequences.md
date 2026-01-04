# Animation Sequences

`@philjs/motion` provides an `AnimationSequence` class for orchestrating complex, multi-step animations. Sequences allow you to chain animations, stagger elements, and create sophisticated motion choreography.

## Core Concepts

Animation sequences solve several challenges:

1. **Ordered Animations**: Execute animations one after another
2. **Staggered Entry**: Delay animations for each element in a group
3. **Choreography**: Coordinate multiple elements for cohesive motion
4. **Reusability**: Define animations once, replay multiple times

## AnimationSequence Class

### Basic Usage

```typescript
import { AnimationSequence, SpringPresets } from '@philjs/motion';

const sequence = new AnimationSequence();

// Chain animations using .to()
sequence
  .to(element1, { opacity: 1, y: 0 })
  .to(element2, { opacity: 1, x: 0 })
  .to(element3, { scale: 1 });

// Play the sequence (animations run in order)
await sequence.play();
```

### The .to() Method

```typescript
sequence.to(
  targets,    // HTMLElement or HTMLElement[]
  values,     // TransformValues to animate to
  options     // Optional configuration
);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `targets` | `HTMLElement \| HTMLElement[]` | Element(s) to animate |
| `values` | `TransformValues` | Target transform values |
| `options.config` | `SpringConfig` | Spring configuration |
| `options.stagger` | `number` | Delay between elements (ms) |

### Available Transform Values

```typescript
interface TransformValues {
  x?: number;        // translateX (px)
  y?: number;        // translateY (px)
  z?: number;        // translateZ (px)
  scale?: number;    // Uniform scale
  scaleX?: number;   // Horizontal scale
  scaleY?: number;   // Vertical scale
  rotate?: number;   // Rotation (degrees)
  rotateX?: number;  // X-axis rotation
  rotateY?: number;  // Y-axis rotation
  rotateZ?: number;  // Z-axis rotation
  skewX?: number;    // X skew (degrees)
  skewY?: number;    // Y skew (degrees)
  opacity?: number;  // 0-1
}
```

## Sequential Animations

Animations in a sequence run one after another:

```typescript
const sequence = new AnimationSequence();

// First: fade in header
sequence.to(header, { opacity: 1, y: 0 }, { config: SpringPresets.gentle });

// Then: slide in sidebar
sequence.to(sidebar, { x: 0, opacity: 1 }, { config: SpringPresets.stiff });

// Then: scale up content
sequence.to(content, { scale: 1, opacity: 1 }, { config: SpringPresets.bouncy });

// Finally: fade in footer
sequence.to(footer, { opacity: 1 }, { config: SpringPresets.gentle });

// Each animation waits for the previous to complete
await sequence.play();
```

## Staggered Animations

Stagger creates a cascading effect when animating multiple elements:

```typescript
const items = document.querySelectorAll('.list-item');

const sequence = new AnimationSequence();

sequence.to(
  Array.from(items),
  { opacity: 1, y: 0 },
  {
    stagger: 50,  // 50ms delay between each element
    config: SpringPresets.gentle,
  }
);

await sequence.play();
```

### How Stagger Works

```typescript
// With stagger: 50
// Element 0: starts at 0ms
// Element 1: starts at 50ms
// Element 2: starts at 100ms
// Element 3: starts at 150ms
// etc.
```

### Stagger Variations

```typescript
// Fast stagger for snappy lists
sequence.to(items, { opacity: 1, y: 0 }, { stagger: 30 });

// Slow stagger for dramatic reveals
sequence.to(items, { opacity: 1, y: 0 }, { stagger: 150 });

// Combined with bouncy spring for playful effect
sequence.to(items, { opacity: 1, scale: 1 }, {
  stagger: 50,
  config: SpringPresets.bouncy,
});
```

## Complex Choreography

### Multi-Stage Animation

```typescript
const sequence = new AnimationSequence();

// Stage 1: Initial reveal
sequence.to(overlay, { opacity: 0 }, { config: SpringPresets.gentle });

// Stage 2: Staggered list items
const listItems = document.querySelectorAll('.item');
sequence.to(Array.from(listItems), { opacity: 1, y: 0 }, {
  stagger: 40,
  config: SpringPresets.stiff,
});

// Stage 3: Hero section
sequence.to(hero, { scale: 1, opacity: 1 }, { config: SpringPresets.bouncy });

// Stage 4: Call to action
sequence.to(cta, { y: 0, opacity: 1 }, { config: SpringPresets.snappy });

await sequence.play();
```

### Page Transition

```typescript
async function pageTransition(oldPage: HTMLElement, newPage: HTMLElement) {
  const sequence = new AnimationSequence();

  // Exit animation for old page
  sequence.to(oldPage, { opacity: 0, x: -50 }, { config: SpringPresets.stiff });

  // Entry animation for new page
  newPage.style.transform = 'translateX(50px)';
  newPage.style.opacity = '0';

  sequence.to(newPage, { opacity: 1, x: 0 }, { config: SpringPresets.snappy });

  await sequence.play();

  oldPage.remove();
}
```

### Modal Animation

```typescript
async function openModal(modal: HTMLElement, backdrop: HTMLElement) {
  const sequence = new AnimationSequence();

  // Start hidden
  backdrop.style.opacity = '0';
  modal.style.transform = 'scale(0.9) translateY(20px)';
  modal.style.opacity = '0';

  // Fade in backdrop
  sequence.to(backdrop, { opacity: 1 }, { config: SpringPresets.gentle });

  // Scale and fade modal
  sequence.to(modal, { scale: 1, y: 0, opacity: 1 }, {
    config: SpringPresets.bouncy,
  });

  await sequence.play();
}

async function closeModal(modal: HTMLElement, backdrop: HTMLElement) {
  const sequence = new AnimationSequence();

  // Animate modal out
  sequence.to(modal, { scale: 0.9, y: 20, opacity: 0 }, {
    config: SpringPresets.stiff,
  });

  // Fade backdrop
  sequence.to(backdrop, { opacity: 0 }, { config: SpringPresets.gentle });

  await sequence.play();

  modal.style.display = 'none';
  backdrop.style.display = 'none';
}
```

## Resetting Sequences

### The reset() Method

Reset a sequence to use it again:

```typescript
const sequence = new AnimationSequence();

sequence.to(element, { opacity: 1, scale: 1 });

// Play the animation
await sequence.play();

// Reset to initial state
sequence.reset();

// Now you can modify and play again
sequence.to(element, { x: 100 });
await sequence.play();
```

### Replay Pattern

```typescript
const introSequence = new AnimationSequence();

introSequence
  .to(logo, { opacity: 1, scale: 1 })
  .to(tagline, { opacity: 1, y: 0 })
  .to(cta, { opacity: 1, scale: 1 });

// Initial play
await introSequence.play();

// Later: replay on user action
replayButton.addEventListener('click', async () => {
  // Reset elements to initial state
  logo.style.opacity = '0';
  logo.style.transform = 'scale(0.8)';
  tagline.style.opacity = '0';
  tagline.style.transform = 'translateY(20px)';
  cta.style.opacity = '0';
  cta.style.transform = 'scale(0.9)';

  // Reset and replay
  introSequence.reset();
  introSequence
    .to(logo, { opacity: 1, scale: 1 })
    .to(tagline, { opacity: 1, y: 0 })
    .to(cta, { opacity: 1, scale: 1 });

  await introSequence.play();
});
```

## Practical Examples

### Staggered List Entry

```typescript
import { AnimationSequence, SpringPresets } from '@philjs/motion';

function animateListIn(listElement: HTMLElement) {
  const items = Array.from(listElement.children) as HTMLElement[];

  // Set initial state
  items.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
  });

  const sequence = new AnimationSequence();

  sequence.to(items, { opacity: 1, y: 0 }, {
    stagger: 50,
    config: SpringPresets.gentle,
  });

  return sequence.play();
}
```

### Card Cascade

```typescript
function cascadeCards(cards: HTMLElement[]) {
  // Initial state: stacked and hidden
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = `translateY(${50 + index * 10}px) scale(0.95)`;
    card.style.zIndex = String(cards.length - index);
  });

  const sequence = new AnimationSequence();

  sequence.to(cards, { opacity: 1, y: 0, scale: 1 }, {
    stagger: 80,
    config: SpringPresets.bouncy,
  });

  return sequence.play();
}
```

### Loading Skeleton Reveal

```typescript
async function revealContent(
  skeletons: HTMLElement[],
  content: HTMLElement[]
) {
  const sequence = new AnimationSequence();

  // Fade out skeletons
  sequence.to(skeletons, { opacity: 0 }, {
    stagger: 30,
    config: SpringPresets.stiff,
  });

  // Fade in content
  content.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
  });

  sequence.to(content, { opacity: 1, y: 0 }, {
    stagger: 50,
    config: SpringPresets.gentle,
  });

  await sequence.play();

  // Remove skeletons from DOM
  skeletons.forEach(skeleton => skeleton.remove());
}
```

### Notification Stack

```typescript
function showNotification(container: HTMLElement, message: string) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(100%)';

  container.appendChild(notification);

  const sequence = new AnimationSequence();

  // Slide in
  sequence.to(notification, { opacity: 1, x: 0 }, {
    config: SpringPresets.snappy,
  });

  sequence.play();

  // Auto-dismiss after 3 seconds
  setTimeout(async () => {
    const dismissSequence = new AnimationSequence();
    dismissSequence.to(notification, { opacity: 0, x: 100 }, {
      config: SpringPresets.stiff,
    });
    await dismissSequence.play();
    notification.remove();
  }, 3000);
}
```

### Accordion Expansion

```typescript
async function expandAccordion(accordion: HTMLElement) {
  const header = accordion.querySelector('.header') as HTMLElement;
  const content = accordion.querySelector('.content') as HTMLElement;
  const icon = accordion.querySelector('.icon') as HTMLElement;

  // Show content
  content.style.display = 'block';
  content.style.opacity = '0';
  content.style.transform = 'translateY(-10px)';

  const sequence = new AnimationSequence();

  // Rotate icon
  sequence.to(icon, { rotate: 180 }, { config: SpringPresets.stiff });

  // Reveal content
  sequence.to(content, { opacity: 1, y: 0 }, { config: SpringPresets.gentle });

  await sequence.play();
}
```

## Best Practices

### 1. Set Initial States Before Animating

```typescript
// Good: Set initial state, then animate
elements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
});

sequence.to(elements, { opacity: 1, y: 0 });
await sequence.play();

// Bad: Animating without known initial state
sequence.to(elements, { opacity: 1, y: 0 });
await sequence.play(); // Elements might already be at these values!
```

### 2. Choose Appropriate Stagger Values

```typescript
// Too fast (feels rushed)
sequence.to(items, values, { stagger: 10 });

// Too slow (feels sluggish)
sequence.to(items, values, { stagger: 300 });

// Good range: 30-100ms for most UI animations
sequence.to(items, values, { stagger: 50 });
```

### 3. Match Spring Config to Animation Purpose

```typescript
// Entry animations: use gentle springs
sequence.to(element, { opacity: 1, y: 0 }, { config: SpringPresets.gentle });

// Exit animations: use stiffer springs
sequence.to(element, { opacity: 0, y: -20 }, { config: SpringPresets.stiff });

// Attention/emphasis: use bouncy springs
sequence.to(element, { scale: 1.1 }, { config: SpringPresets.bouncy });
```

### 4. Clean Up Transform Styles

```typescript
const sequence = new AnimationSequence();
sequence.to(element, { x: 0, y: 0, scale: 1, opacity: 1 });

await sequence.play();

// Clean up after animation completes
element.style.transform = '';
element.style.opacity = '';
```

### 5. Handle Interruptions

```typescript
let currentSequence: AnimationSequence | null = null;

async function playAnimation() {
  // Cancel any running animation
  if (currentSequence) {
    currentSequence.reset();
  }

  currentSequence = new AnimationSequence();
  currentSequence.to(element, { opacity: 1, y: 0 });

  try {
    await currentSequence.play();
  } finally {
    currentSequence = null;
  }
}
```

## Performance Tips

### 1. Limit Concurrent Animations

```typescript
// Instead of animating 100 items at once
sequence.to(allItems, { opacity: 1 }, { stagger: 10 });

// Consider animating in batches
const batches = chunk(allItems, 10);
for (const batch of batches) {
  sequence.to(batch, { opacity: 1 }, { stagger: 20 });
}
```

### 2. Use will-change Strategically

```typescript
// Before animation
elements.forEach(el => {
  el.style.willChange = 'transform, opacity';
});

await sequence.play();

// After animation
elements.forEach(el => {
  el.style.willChange = 'auto';
});
```

### 3. Prefer Transform Over Layout Properties

```typescript
// Good: GPU-accelerated
sequence.to(element, { x: 100, y: 50, scale: 1.2, opacity: 0.5 });

// Avoid: Triggers layout
// Don't animate width, height, margin, padding directly
```

## Next Steps

- [Spring Physics Deep Dive](./spring-physics.md)
- [Gesture-Driven Animations](./gestures.md)
- [Scroll-Linked Animations](./scroll-animations.md)
- [FLIP Layout Animations](./flip-animations.md)
- [Animation Hooks](./hooks.md)
