# Gesture-Driven Animations

`@philjs/motion` provides a powerful gesture system that connects user input directly to spring physics animations. This creates fluid, responsive interactions that feel natural and intuitive.

## Core Concepts

Gesture animations bridge the gap between user input (touch, mouse, trackpad) and spring physics. Key principles:

1. **Direct manipulation**: Elements follow the user's finger/cursor with zero lag
2. **Momentum preservation**: When released, elements continue with the user's velocity
3. **Spring settling**: Elements settle to final positions using spring physics
4. **Bounds enforcement**: Gestures can be constrained to specific areas

## GestureAnimation Class

### Basic Setup

```typescript
import { GestureAnimation, SpringPresets } from '@philjs/motion';

const element = document.getElementById('draggable');

// Create gesture handler with spring config
const gesture = new GestureAnimation(element, SpringPresets.stiff);

// Element is now draggable!
```

### Setting Bounds

Constrain the draggable area:

```typescript
const gesture = new GestureAnimation(element, SpringPresets.stiff);

// Limit movement to a specific area
gesture.setBounds({
  minX: -200,  // Can't drag further left than -200px
  maxX: 200,   // Can't drag further right than 200px
  minY: -100,  // Can't drag further up than -100px
  maxY: 100,   // Can't drag further down than 100px
});
```

### Dynamic Bounds

```typescript
const gesture = new GestureAnimation(element);

function updateBounds() {
  const container = document.getElementById('container');
  const rect = container.getBoundingClientRect();
  const elemRect = element.getBoundingClientRect();

  gesture.setBounds({
    minX: 0,
    maxX: rect.width - elemRect.width,
    minY: 0,
    maxY: rect.height - elemRect.height,
  });
}

// Update on resize
window.addEventListener('resize', updateBounds);
updateBounds();
```

## Gesture State

The gesture system tracks comprehensive state information:

```typescript
interface GestureState {
  x: number;          // Current X position (relative to start)
  y: number;          // Current Y position (relative to start)
  dx: number;         // X movement since last frame
  dy: number;         // Y movement since last frame
  vx: number;         // X velocity in pixels/second
  vy: number;         // Y velocity in pixels/second
  isDragging: boolean; // Currently being dragged
  isPinching: boolean; // Pinch gesture active
  scale: number;      // Pinch scale factor
  rotation: number;   // Pinch rotation in degrees
}
```

### Reading State

```typescript
const gesture = new GestureAnimation(element);

// Get current state at any time
const state = gesture.getState();

console.log(`Position: (${state.x}, ${state.y})`);
console.log(`Velocity: (${state.vx}, ${state.vy})`);
console.log(`Is dragging: ${state.isDragging}`);
```

## Drag End Callbacks

The most powerful feature is responding to drag releases:

```typescript
const gesture = new GestureAnimation(element, SpringPresets.stiff);

gesture.onDragEnd((state) => {
  console.log('Released at:', state.x, state.y);
  console.log('With velocity:', state.vx, state.vy);
});
```

### Swipe Detection

```typescript
const SWIPE_THRESHOLD = 100;    // Minimum distance
const VELOCITY_THRESHOLD = 500; // Minimum speed

gesture.onDragEnd((state) => {
  const isSwipeRight = state.x > SWIPE_THRESHOLD || state.vx > VELOCITY_THRESHOLD;
  const isSwipeLeft = state.x < -SWIPE_THRESHOLD || state.vx < -VELOCITY_THRESHOLD;
  const isSwipeUp = state.y < -SWIPE_THRESHOLD || state.vy < -VELOCITY_THRESHOLD;
  const isSwipeDown = state.y > SWIPE_THRESHOLD || state.vy > VELOCITY_THRESHOLD;

  if (isSwipeRight) handleSwipeRight();
  else if (isSwipeLeft) handleSwipeLeft();
  else if (isSwipeUp) handleSwipeUp();
  else if (isSwipeDown) handleSwipeDown();
  else gesture.reset(); // Snap back
});
```

### Snap Points

```typescript
const SNAP_POINTS = [0, 100, 200, 300];

gesture.onDragEnd((state) => {
  // Find closest snap point
  const closest = SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - state.x) < Math.abs(prev - state.x) ? curr : prev
  );

  // Consider velocity for momentum-based snapping
  if (state.vx > 200) {
    // Moving right - snap to next point
    const nextIndex = SNAP_POINTS.indexOf(closest) + 1;
    if (nextIndex < SNAP_POINTS.length) {
      gesture.animateTo(SNAP_POINTS[nextIndex], state.y);
      return;
    }
  }

  gesture.animateTo(closest, state.y);
});
```

### Velocity-Based Actions

```typescript
gesture.onDragEnd((state) => {
  const speed = Math.sqrt(state.vx ** 2 + state.vy ** 2);

  if (speed > 1000) {
    // Fast throw - animate off screen
    const direction = Math.atan2(state.vy, state.vx);
    const offScreenX = Math.cos(direction) * 1000;
    const offScreenY = Math.sin(direction) * 1000;
    gesture.animateTo(offScreenX, offScreenY);
  } else {
    // Slow release - snap back
    gesture.reset();
  }
});
```

## Programmatic Animation

### Animate to Position

```typescript
const gesture = new GestureAnimation(element, SpringPresets.bouncy);

// Animate to specific position
await gesture.animateTo(100, 50);

// Chain animations
await gesture.animateTo(200, 100);
await gesture.animateTo(0, 0);
```

### Reset to Origin

```typescript
// Animate back to starting position
await gesture.reset();
```

## Practical Examples

### Swipeable Card Stack

```typescript
import { GestureAnimation, SpringPresets } from '@philjs/motion';

function createSwipeableCard(element: HTMLElement, onSwipe: (direction: 'left' | 'right') => void) {
  const gesture = new GestureAnimation(element, SpringPresets.stiff);

  gesture.onDragEnd((state) => {
    const threshold = 100;
    const velocityThreshold = 500;

    if (state.x > threshold || state.vx > velocityThreshold) {
      // Swiped right - animate off screen
      gesture.animateTo(window.innerWidth, state.y);
      setTimeout(() => onSwipe('right'), 300);
    } else if (state.x < -threshold || state.vx < -velocityThreshold) {
      // Swiped left - animate off screen
      gesture.animateTo(-window.innerWidth, state.y);
      setTimeout(() => onSwipe('left'), 300);
    } else {
      // Not enough momentum - snap back
      gesture.reset();
    }
  });

  return gesture;
}

// Usage
const cards = document.querySelectorAll('.card');
cards.forEach((card, index) => {
  createSwipeableCard(card as HTMLElement, (direction) => {
    console.log(`Card ${index} swiped ${direction}`);
    card.remove();
  });
});
```

### Drawer/Panel

```typescript
function createDrawer(element: HTMLElement, width: number) {
  const gesture = new GestureAnimation(element, SpringPresets.snappy);

  let isOpen = false;

  // Constrain to horizontal movement only
  gesture.setBounds({
    minX: -width,
    maxX: 0,
    minY: 0,
    maxY: 0,
  });

  gesture.onDragEnd((state) => {
    const openThreshold = width / 2;
    const velocityThreshold = 300;

    // Open if dragged far enough or with enough velocity
    const shouldOpen = state.x < -openThreshold || state.vx < -velocityThreshold;

    if (shouldOpen) {
      gesture.animateTo(-width, 0);
      isOpen = true;
    } else {
      gesture.animateTo(0, 0);
      isOpen = false;
    }
  });

  return {
    open: () => {
      gesture.animateTo(-width, 0);
      isOpen = true;
    },
    close: () => {
      gesture.animateTo(0, 0);
      isOpen = false;
    },
    toggle: () => isOpen ? gesture.animateTo(0, 0) : gesture.animateTo(-width, 0),
    dispose: () => gesture.dispose(),
  };
}
```

### Reorderable List

```typescript
function makeReorderable(list: HTMLElement) {
  const items = Array.from(list.children) as HTMLElement[];
  const gestures: GestureAnimation[] = [];
  const itemHeight = items[0].offsetHeight;

  items.forEach((item, index) => {
    const gesture = new GestureAnimation(item, SpringPresets.stiff);

    // Only allow vertical movement
    gesture.setBounds({
      minX: 0,
      maxX: 0,
      minY: -index * itemHeight,
      maxY: (items.length - 1 - index) * itemHeight,
    });

    gesture.onDragEnd((state) => {
      // Calculate new position
      const offset = Math.round(state.y / itemHeight);
      const newIndex = index + offset;

      if (newIndex !== index && newIndex >= 0 && newIndex < items.length) {
        // Reorder items
        reorderItems(index, newIndex);
      }

      // Reset all positions
      items.forEach((_, i) => gestures[i].reset());
    });

    gestures.push(gesture);
  });

  function reorderItems(from: number, to: number) {
    const [removed] = items.splice(from, 1);
    items.splice(to, 0, removed);

    // Update DOM
    items.forEach(item => list.appendChild(item));
  }

  return {
    dispose: () => gestures.forEach(g => g.dispose()),
  };
}
```

### Pull to Refresh

```typescript
function createPullToRefresh(
  container: HTMLElement,
  onRefresh: () => Promise<void>
) {
  const indicator = container.querySelector('.refresh-indicator') as HTMLElement;
  const content = container.querySelector('.content') as HTMLElement;
  const gesture = new GestureAnimation(content, SpringPresets.stiff);

  const TRIGGER_THRESHOLD = 80;
  let isRefreshing = false;

  // Only allow pulling down
  gesture.setBounds({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 150,
  });

  gesture.onDragEnd(async (state) => {
    if (isRefreshing) return;

    if (state.y >= TRIGGER_THRESHOLD) {
      isRefreshing = true;

      // Hold at refresh position
      gesture.animateTo(0, TRIGGER_THRESHOLD);
      indicator.textContent = 'Refreshing...';

      try {
        await onRefresh();
      } finally {
        isRefreshing = false;
        await gesture.reset();
        indicator.textContent = 'Pull to refresh';
      }
    } else {
      gesture.reset();
    }
  });

  return gesture;
}
```

### Image Pan/Zoom

```typescript
function createPanZoom(image: HTMLElement) {
  const gesture = new GestureAnimation(image, SpringPresets.snappy);

  let scale = 1;
  const minScale = 1;
  const maxScale = 4;

  // Update bounds based on scale
  function updateBounds() {
    const container = image.parentElement!;
    const overflow = {
      x: (image.offsetWidth * scale - container.offsetWidth) / 2,
      y: (image.offsetHeight * scale - container.offsetHeight) / 2,
    };

    gesture.setBounds({
      minX: -Math.max(0, overflow.x),
      maxX: Math.max(0, overflow.x),
      minY: -Math.max(0, overflow.y),
      maxY: Math.max(0, overflow.y),
    });
  }

  // Handle pinch zoom
  image.addEventListener('wheel', (e) => {
    e.preventDefault();

    const delta = e.deltaY * -0.01;
    scale = Math.min(maxScale, Math.max(minScale, scale + delta));

    image.style.transform = `scale(${scale}) translate(${gesture.getState().x}px, ${gesture.getState().y}px)`;
    updateBounds();
  });

  updateBounds();

  return {
    resetZoom: () => {
      scale = 1;
      gesture.reset();
      updateBounds();
    },
    dispose: () => gesture.dispose(),
  };
}
```

## React Hook: useGesture

For React/Preact integration:

```typescript
import { useGesture } from '@philjs/motion';
import { useRef, useEffect } from 'preact/hooks';

function DraggableCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { state, setBounds, animateTo, reset } = useGesture(ref, SpringPresets.stiff);

  useEffect(() => {
    setBounds({
      minX: -200,
      maxX: 200,
      minY: -100,
      maxY: 100,
    });
  }, [setBounds]);

  return (
    <div ref={ref} class="card">
      <p>Position: ({Math.round(state.x)}, {Math.round(state.y)})</p>
      <p>Velocity: ({Math.round(state.vx)}, {Math.round(state.vy)})</p>
      <button onClick={() => reset()}>Reset</button>
      <button onClick={() => animateTo(100, 50)}>Go to (100, 50)</button>
    </div>
  );
}
```

## Performance Tips

### Passive Event Listeners

The gesture system uses passive event listeners for scroll performance:

```typescript
// Internally, @philjs/motion uses:
element.addEventListener('scroll', handler, { passive: true });
```

### GPU Acceleration

Transforms are automatically GPU-accelerated:

```typescript
// @philjs/motion applies transforms via translate3d
element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
```

### Cleanup

Always dispose when done:

```typescript
const gesture = new GestureAnimation(element);

// When component unmounts or element is removed
gesture.dispose();
```

## Accessibility Considerations

Ensure gesture-driven interfaces are accessible:

```typescript
const gesture = new GestureAnimation(element);

// Add keyboard support
element.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 50 : 10;

  switch (e.key) {
    case 'ArrowLeft':
      gesture.animateTo(gesture.getState().x - step, gesture.getState().y);
      break;
    case 'ArrowRight':
      gesture.animateTo(gesture.getState().x + step, gesture.getState().y);
      break;
    case 'ArrowUp':
      gesture.animateTo(gesture.getState().x, gesture.getState().y - step);
      break;
    case 'ArrowDown':
      gesture.animateTo(gesture.getState().x, gesture.getState().y + step);
      break;
    case 'Home':
      gesture.reset();
      break;
  }
});

// Make focusable
element.setAttribute('tabindex', '0');
element.setAttribute('role', 'slider');
element.setAttribute('aria-label', 'Draggable element');
```

## Next Steps

- [Spring Physics Deep Dive](./spring-physics.md)
- [Scroll-Linked Animations](./scroll-animations.md)
- [Animation Sequences](./sequences.md)
- [FLIP Layout Animations](./flip-animations.md)
