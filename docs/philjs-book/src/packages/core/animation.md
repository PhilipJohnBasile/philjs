# Animation and Motion

PhilJS provides a complete animation system with spring physics, duration-based animations, FLIP layout animations, and gesture handling - all without external dependencies.

## Overview

The animation module includes:

- **Animated Values**: Reactive values with spring or eased transitions
- **Easing Functions**: Built-in easing library
- **FLIP Animator**: Smooth layout transitions
- **Gesture Handlers**: Touch and mouse interaction
- **Parallax Effects**: Scroll-driven animations

## Animated Values

### createAnimatedValue

Create an animated value that transitions smoothly between values:

```typescript
import { createAnimatedValue, easings } from '@philjs/core/animation';

// Create with initial value
const progress = createAnimatedValue(0);

// Animate to new value
progress.set(1);

// Read current value
console.log(progress.value); // Value between 0 and 1 during animation

// Check if animating
console.log(progress.isAnimating); // true during transition
```

### AnimatedValue API

```typescript
interface AnimatedValue {
  value: number;          // Current interpolated value
  target: number;         // Target value
  velocity: number;       // Current velocity (for springs)
  isAnimating: boolean;   // Whether animation is in progress

  set: (value: number, options?: AnimationOptions) => void;
  stop: () => void;
  subscribe: (callback: (value: number) => void) => () => void;
}
```

### Duration-Based Animation

```typescript
const opacity = createAnimatedValue(0, {
  duration: 300,
  easing: easings.easeOut
});

// Animate with options
opacity.set(1, {
  duration: 500,
  easing: easings.easeInOut,
  onComplete: () => console.log('Animation complete')
});

// Animate with callbacks
opacity.set(1, {
  duration: 400,
  onUpdate: (value) => {
    element.style.opacity = String(value);
  },
  onComplete: () => {
    element.classList.add('visible');
  }
});
```

### Spring Physics

For natural, physics-based motion:

```typescript
const position = createAnimatedValue(0);

// Spring animation
position.set(100, {
  easing: {
    stiffness: 0.15,   // Spring tension (0-1)
    damping: 0.8,      // Friction (0-1)
    mass: 1,           // Object mass
    restVelocity: 0.001,  // Velocity threshold for completion
    restDistance: 0.001   // Distance threshold for completion
  }
});

// Bouncy spring (low damping)
position.set(100, {
  easing: { stiffness: 0.3, damping: 0.4, mass: 1 }
});

// Stiff spring (high stiffness)
position.set(100, {
  easing: { stiffness: 0.5, damping: 0.8, mass: 1 }
});

// Heavy object (high mass)
position.set(100, {
  easing: { stiffness: 0.15, damping: 0.8, mass: 3 }
});
```

### Subscribing to Updates

React to value changes:

```typescript
const scale = createAnimatedValue(1);

// Subscribe to updates
const unsubscribe = scale.subscribe((value) => {
  element.style.transform = `scale(${value})`;
});

// Animate
scale.set(1.5);

// Clean up
unsubscribe();
```

### Integration with Signals

```typescript
import { signal, effect } from '@philjs/core';
import { createAnimatedValue } from '@philjs/core/animation';

const isExpanded = signal(false);
const height = createAnimatedValue(0);

// Animate when signal changes
effect(() => {
  height.set(isExpanded() ? 300 : 0, {
    easing: { stiffness: 0.2, damping: 0.7, mass: 1 }
  });
});

// Apply to DOM
height.subscribe((value) => {
  panel.style.height = `${value}px`;
});
```

## Easing Functions

### Built-in Easings

```typescript
import { easings } from '@philjs/core/animation';

// Linear
easings.linear         // No easing

// Quadratic
easings.easeIn         // Accelerate
easings.easeOut        // Decelerate
easings.easeInOut      // Accelerate then decelerate

// Cubic (smoother)
easings.easeInCubic
easings.easeOutCubic
easings.easeInOutCubic

// Quartic (more pronounced)
easings.easeInQuart
easings.easeOutQuart
easings.easeInOutQuart

// Bounce
easings.bounce         // Bouncy finish
```

### Custom Easing

```typescript
// Custom easing function: (t: number) => number
// t goes from 0 to 1, return value should also be 0 to 1

const customEasing = (t: number) => {
  // Ease out elastic
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

progress.set(1, {
  duration: 1000,
  easing: customEasing
});
```

### Easing Visualizer

```typescript
// Visualize an easing function
function visualizeEasing(easing: (t: number) => number) {
  const points: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const y = easing(t);
    points.push(`${t * 200},${(1 - y) * 100}`);
  }
  return `<polyline points="${points.join(' ')}" />`;
}
```

## FLIP Animations

FLIP (First, Last, Invert, Play) enables smooth layout animations:

### Basic FLIP

```typescript
import { FLIPAnimator } from '@philjs/core/animation';

const flip = new FLIPAnimator();

// 1. Record positions before change
flip.recordPositions('[data-flip]');

// 2. Make DOM changes
reorderItems();
// or
element.classList.add('expanded');
// or
container.appendChild(newElement);

// 3. Animate from old to new positions
flip.animateChanges({ duration: 300 });
```

### FLIP with Options

```typescript
flip.animateChanges({
  duration: 400,
  easing: 'ease-out'
});
```

### List Reordering

```typescript
function TodoList() {
  const flip = new FLIPAnimator();

  const sortItems = (sortFn: (a: Todo, b: Todo) => number) => {
    // Record current positions
    flip.recordPositions('[data-flip]');

    // Sort items
    todos.set(items => [...items].sort(sortFn));

    // Wait for DOM update, then animate
    requestAnimationFrame(() => {
      flip.animateChanges({ duration: 300 });
    });
  };

  return (
    <div>
      <button onClick={() => sortItems((a, b) => a.text.localeCompare(b.text))}>
        Sort A-Z
      </button>
      <ul>
        {todos().map(todo => (
          <li key={todo.id} data-flip data-flip-id={todo.id}>
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Accordion

```typescript
function Accordion() {
  const flip = new FLIPAnimator();
  const expanded = signal<string | null>(null);

  const toggle = (id: string) => {
    flip.recordPositions('[data-flip]');

    if (expanded() === id) {
      expanded.set(null);
    } else {
      expanded.set(id);
    }

    requestAnimationFrame(() => {
      flip.animateChanges({ duration: 250 });
    });
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id} data-flip data-flip-id={item.id}>
          <button onClick={() => toggle(item.id)}>
            {item.title}
          </button>
          {expanded() === item.id && (
            <div class="content">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Gesture Handlers

### attachGestures

Attach touch and mouse gesture handlers:

```typescript
import { attachGestures } from '@philjs/core/animation';

const element = document.getElementById('draggable')!;

const cleanup = attachGestures(element, {
  onDragStart: (event) => {
    console.log('Drag started');
    element.classList.add('dragging');
  },

  onDrag: (event, delta) => {
    console.log(`Moved: ${delta.x}px, ${delta.y}px`);
    element.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
  },

  onDragEnd: (event) => {
    console.log('Drag ended');
    element.classList.remove('dragging');
  },

  onSwipe: (direction) => {
    console.log(`Swiped ${direction}`);
    // 'up' | 'down' | 'left' | 'right'
  },

  onTap: () => {
    console.log('Tapped');
  },

  onDoubleTap: () => {
    console.log('Double tapped');
  },

  onLongPress: () => {
    console.log('Long pressed');
  }
});

// Clean up when done
cleanup();
```

### Swipe to Delete

```typescript
function SwipeableItem({ item, onDelete }) {
  let elementRef: HTMLElement;
  const translateX = createAnimatedValue(0);

  effect(() => {
    if (!elementRef) return;

    const cleanup = attachGestures(elementRef, {
      onDrag: (event, delta) => {
        // Only allow left swipe
        if (delta.x < 0) {
          translateX.set(delta.x, { duration: 0 });
        }
      },

      onDragEnd: (event) => {
        const threshold = -100;
        if (translateX.value < threshold) {
          // Swipe past threshold - delete
          translateX.set(-elementRef.offsetWidth, {
            duration: 200,
            onComplete: () => onDelete(item.id)
          });
        } else {
          // Snap back
          translateX.set(0, {
            easing: { stiffness: 0.3, damping: 0.8, mass: 1 }
          });
        }
      }
    });

    translateX.subscribe((x) => {
      elementRef.style.transform = `translateX(${x}px)`;
    });

    onCleanup(cleanup);
  });

  return (
    <div ref={el => elementRef = el} class="swipeable-item">
      {item.text}
    </div>
  );
}
```

### Pinch to Zoom

```typescript
const scale = createAnimatedValue(1);
let initialScale = 1;

attachGestures(element, {
  onPinchStart: (event) => {
    initialScale = scale.value;
  },

  onPinch: (event, pinchScale) => {
    const newScale = Math.max(0.5, Math.min(3, initialScale * pinchScale));
    scale.set(newScale, { duration: 0 });
  },

  onPinchEnd: (event) => {
    // Snap to 1 if close
    if (Math.abs(scale.value - 1) < 0.1) {
      scale.set(1, {
        easing: { stiffness: 0.3, damping: 0.8, mass: 1 }
      });
    }
  }
});

scale.subscribe((s) => {
  element.style.transform = `scale(${s})`;
});
```

## Parallax

### createParallax

Create scroll-driven parallax effects:

```typescript
import { createParallax } from '@philjs/core/animation';

// Basic parallax
const cleanup = createParallax(element, {
  speed: 0.5 // Moves at half scroll speed
});

// Negative speed (opposite direction)
createParallax(element, { speed: -0.3 });

// Horizontal parallax
createParallax(element, {
  speed: 0.5,
  axis: 'x'
});

// Both axes
createParallax(element, {
  speed: 0.3,
  axis: 'both'
});

// With offset
createParallax(element, {
  speed: 0.5,
  offset: 200 // Start parallax 200px from top
});
```

### Parallax Layers

```typescript
function ParallaxScene() {
  return (
    <div class="parallax-container">
      <div
        class="layer-back"
        ref={el => createParallax(el, { speed: 0.2 })}
      >
        <img src="/mountains-back.png" />
      </div>
      <div
        class="layer-mid"
        ref={el => createParallax(el, { speed: 0.5 })}
      >
        <img src="/mountains-mid.png" />
      </div>
      <div
        class="layer-front"
        ref={el => createParallax(el, { speed: 0.8 })}
      >
        <img src="/mountains-front.png" />
      </div>
    </div>
  );
}
```

## Animation Patterns

### Staggered Animations

```typescript
function StaggeredList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map((item, index) => {
        const opacity = createAnimatedValue(0);
        const translateY = createAnimatedValue(20);

        // Stagger delay based on index
        setTimeout(() => {
          opacity.set(1, { duration: 300 });
          translateY.set(0, {
            easing: { stiffness: 0.3, damping: 0.8, mass: 1 }
          });
        }, index * 50);

        return (
          <li
            key={item.id}
            style={{
              opacity: opacity.value,
              transform: `translateY(${translateY.value}px)`
            }}
          >
            {item.text}
          </li>
        );
      })}
    </ul>
  );
}
```

### Page Transitions

```typescript
const pageOpacity = createAnimatedValue(1);
const pageTranslateX = createAnimatedValue(0);

async function navigateTo(path: string) {
  // Exit animation
  await Promise.all([
    new Promise<void>(resolve => {
      pageOpacity.set(0, { duration: 200, onComplete: resolve });
    }),
    new Promise<void>(resolve => {
      pageTranslateX.set(-50, { duration: 200, onComplete: resolve });
    })
  ]);

  // Navigate
  router.push(path);

  // Enter animation
  pageTranslateX.set(50, { duration: 0 });
  pageOpacity.set(0, { duration: 0 });

  requestAnimationFrame(() => {
    pageOpacity.set(1, { duration: 300 });
    pageTranslateX.set(0, {
      easing: { stiffness: 0.2, damping: 0.8, mass: 1 }
    });
  });
}
```

### Loading Skeleton

```typescript
function Skeleton() {
  const shimmer = createAnimatedValue(-100);

  effect(() => {
    const animate = () => {
      shimmer.set(200, {
        duration: 1500,
        easing: easings.linear,
        onComplete: () => {
          shimmer.set(-100, { duration: 0 });
          animate();
        }
      });
    };
    animate();
  });

  return (
    <div class="skeleton">
      <div
        class="shimmer"
        style={{
          transform: `translateX(${shimmer.value}%)`
        }}
      />
    </div>
  );
}
```

## Best Practices

### 1. Use Springs for Interruptible Animations

```typescript
// Good: Springs handle interruptions naturally
const position = createAnimatedValue(0);
position.set(100, { easing: { stiffness: 0.2, damping: 0.8, mass: 1 } });
// User interrupts...
position.set(50, { easing: { stiffness: 0.2, damping: 0.8, mass: 1 } });
// Smoothly redirects to new target

// Bad: Duration-based doesn't handle interruption well
position.set(100, { duration: 300 });
position.set(50, { duration: 300 }); // Jumps
```

### 2. Stop Animations on Cleanup

```typescript
effect(() => {
  const value = createAnimatedValue(0);
  value.set(100, { duration: 1000 });

  onCleanup(() => value.stop());
});
```

### 3. Use requestAnimationFrame for DOM Updates

```typescript
const position = createAnimatedValue(0);

// Good: Batched DOM updates
let raf: number;
position.subscribe((value) => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    element.style.transform = `translateX(${value}px)`;
  });
});

// Or use will-change for GPU acceleration
element.style.willChange = 'transform';
```

### 4. Prefer transform and opacity

```typescript
// Good: GPU-accelerated properties
element.style.transform = `translateX(${x}px) translateY(${y}px)`;
element.style.opacity = String(opacity);

// Bad: Triggers layout
element.style.left = `${x}px`;
element.style.top = `${y}px`;
element.style.width = `${width}px`;
```

## Next Steps

- [Signals and Reactivity](./signals.md) - Integrate with reactive state
- [Effects and Lifecycle](./effects-lifecycle.md) - Animation lifecycle
- [API Reference](./api-reference.md) - Complete API documentation
