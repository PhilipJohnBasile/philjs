# @philjs/motion

Physics-based animation system with spring dynamics, gesture-driven animations, layout animations (FLIP), scroll-linked animations, and orchestrated sequences.

## Installation

```bash
npm install @philjs/motion
```

## Features

- **Spring Physics** - Natural motion with configurable tension/friction
- **Spring Presets** - Ready-to-use animation presets (bouncy, stiff, gentle, etc.)
- **Multi-Dimensional Springs** - Animate multiple values simultaneously
- **Animated Transforms** - GPU-accelerated CSS transforms
- **FLIP Animations** - Smooth layout transitions
- **Gesture Animations** - Drag, pan, and gesture-driven motion
- **Scroll Animations** - Scroll-linked progress and parallax
- **Animation Sequences** - Orchestrated multi-step animations
- **React Hooks** - Easy integration with components

## Quick Start

```typescript
import { Spring, SpringPresets, useSpring } from '@philjs/motion';

// Create a spring
const spring = new Spring(0, SpringPresets.bouncy);

// Animate to a value
await spring.set(100);

// Listen to updates
spring.onUpdate((state) => {
  element.style.transform = `translateX(${spring.get()}px)`;
});
```

## Spring Physics

### Creating a Spring

```typescript
import { Spring, SpringPresets } from '@philjs/motion';

// Basic spring with default config
const spring = new Spring(0);

// Spring with preset
const bouncySpring = new Spring(0, SpringPresets.bouncy);

// Spring with custom config
const customSpring = new Spring(0, {
  tension: 200,    // Spring tension (stiffness)
  friction: 20,    // Damping force
  mass: 1,         // Mass of the object
  velocity: 0,     // Initial velocity
  precision: 0.01, // Stop threshold
  clamp: false,    // Prevent overshooting
});
```

### Spring Presets

```typescript
import { SpringPresets } from '@philjs/motion';

const presets = {
  default: { tension: 170, friction: 26 },   // Balanced
  gentle: { tension: 120, friction: 14 },    // Soft, slow
  wobbly: { tension: 180, friction: 12 },    // Bouncy, playful
  stiff: { tension: 210, friction: 20 },     // Quick, responsive
  slow: { tension: 280, friction: 60 },      // Heavy, deliberate
  molasses: { tension: 280, friction: 120 }, // Very slow
  bouncy: { tension: 600, friction: 10 },    // Very bouncy
  snappy: { tension: 400, friction: 30 },    // Quick snap
};
```

### Animating Values

```typescript
const spring = new Spring(0, SpringPresets.default);

// Get current value
const current = spring.get(); // 0

// Animate to target (returns promise)
await spring.set(100);
console.log(spring.get()); // 100

// Set immediately (no animation)
spring.set(50, true);
console.log(spring.get()); // 50

// Configure spring dynamically
spring.configure({ tension: 300, friction: 25 });

// Stop animation
spring.stop();

// Cleanup
spring.dispose();
```

### Listening to Updates

```typescript
const spring = new Spring(0);

// Subscribe to updates
const unsubscribe = spring.onUpdate((state) => {
  console.log('Value:', spring.get());
  console.log('Velocity:', state.velocity);
  console.log('Progress:', state.progress);
  console.log('Is animating:', state.isAnimating);
});

spring.set(100);

// Later: unsubscribe
unsubscribe();
```

## Multi-Dimensional Springs

### SpringVector

```typescript
import { SpringVector } from '@philjs/motion';

// Create with initial values
const vector = new SpringVector(
  { x: 0, y: 0, scale: 1 },
  SpringPresets.bouncy
);

// Get all values
const values = vector.get(); // { x: 0, y: 0, scale: 1 }

// Get single value
const x = vector.get('x'); // 0

// Animate multiple values
await vector.set({ x: 100, y: 50, scale: 1.5 });

// Set immediately
vector.set({ x: 0, y: 0 }, true);

// Listen to updates
const unsubscribe = vector.onUpdate((values) => {
  console.log(values); // { x: ..., y: ..., scale: ... }
});

// Cleanup
vector.dispose();
```

## Animated Transforms

### Creating Animated Transforms

```typescript
import { AnimatedTransform, SpringPresets } from '@philjs/motion';

const element = document.getElementById('box');

const transform = new AnimatedTransform(
  element,
  { x: 0, y: 0, scale: 1, opacity: 1 },
  SpringPresets.snappy
);

// Animate transforms
await transform.animate({
  x: 100,
  y: 50,
  scale: 1.2,
  rotate: 45,
  opacity: 0.8,
});

// Set immediately
transform.set({ x: 0, y: 0 });

// Get current values
const current = transform.get();

// Cleanup
transform.dispose();
```

### Available Transform Properties

```typescript
interface TransformValues {
  x?: number;        // translateX (px)
  y?: number;        // translateY (px)
  z?: number;        // translateZ (px)
  scale?: number;    // uniform scale
  scaleX?: number;   // horizontal scale
  scaleY?: number;   // vertical scale
  rotate?: number;   // rotation (deg)
  rotateX?: number;  // X-axis rotation (deg)
  rotateY?: number;  // Y-axis rotation (deg)
  rotateZ?: number;  // Z-axis rotation (deg)
  skewX?: number;    // X skew (deg)
  skewY?: number;    // Y skew (deg)
  opacity?: number;  // 0-1
}
```

## FLIP Layout Animations

### Using FlipAnimation

```typescript
import { FlipAnimation, SpringPresets } from '@philjs/motion';

const element = document.getElementById('card');
const flip = new FlipAnimation(element, SpringPresets.snappy);

// 1. Record first position
flip.first();

// 2. Make DOM changes (layout shift)
element.classList.toggle('expanded');

// 3. Animate from old to new position
await flip.play();
```

### FLIP with List Reordering

```typescript
function reorderList(items: HTMLElement[]) {
  // Record all positions
  const flips = items.map(item => {
    const flip = new FlipAnimation(item);
    flip.first();
    return flip;
  });

  // Reorder DOM
  const parent = items[0].parentElement;
  items.reverse().forEach(item => parent.appendChild(item));

  // Animate all
  await Promise.all(flips.map(flip => flip.play()));
}
```

## Gesture-Driven Animations

### Creating Draggable Elements

```typescript
import { GestureAnimation, SpringPresets } from '@philjs/motion';

const element = document.getElementById('draggable');
const gesture = new GestureAnimation(element, SpringPresets.stiff);

// Set drag bounds
gesture.setBounds({
  minX: 0,
  maxX: 300,
  minY: 0,
  maxY: 200,
});

// Handle drag end
gesture.onDragEnd((state) => {
  console.log('Final position:', state.x, state.y);
  console.log('Velocity:', state.vx, state.vy);

  // Snap to grid
  if (Math.abs(state.x) < 50) {
    gesture.animateTo(0, state.y);
  }
});

// Get current state
const state = gesture.getState();

// Animate to position
await gesture.animateTo(100, 100);

// Reset to origin
await gesture.reset();

// Cleanup
gesture.dispose();
```

### Gesture State

```typescript
interface GestureState {
  x: number;          // Current X position
  y: number;          // Current Y position
  dx: number;         // Delta X (movement this frame)
  dy: number;         // Delta Y (movement this frame)
  vx: number;         // X velocity (px/s)
  vy: number;         // Y velocity (px/s)
  isDragging: boolean;
  isPinching: boolean;
  scale: number;      // Pinch scale
  rotation: number;   // Pinch rotation
}
```

## Scroll-Linked Animations

### Basic Scroll Animation

```typescript
import { ScrollAnimation } from '@philjs/motion';

const element = document.getElementById('animated');

const scroll = new ScrollAnimation(element, {
  startOffset: 0,    // Start when element enters viewport
  endOffset: 1,      // End when element exits viewport
});

scroll.onProgress((progress, info) => {
  // progress: 0-1 based on element visibility
  element.style.opacity = String(progress);
  element.style.transform = `translateY(${(1 - progress) * 50}px)`;

  console.log('Scroll Y:', info.y);
  console.log('Direction:', info.direction); // 'up' | 'down'
  console.log('Velocity:', info.velocity);
});

// Cleanup
scroll.dispose();
```

### Parallax Effect

```typescript
const scroll = new ScrollAnimation(element);

scroll.onProgress((progress) => {
  // Move slower than scroll (parallax)
  element.style.transform = `translateY(${progress * -100}px)`;
});
```

### Scroll-Triggered Animations

```typescript
const scroll = new ScrollAnimation(element);

let hasTriggered = false;

scroll.onProgress((progress) => {
  if (progress > 0.5 && !hasTriggered) {
    hasTriggered = true;
    playAnimation();
  }
});
```

## Animation Sequences

### Creating Sequences

```typescript
import { AnimationSequence, SpringPresets } from '@philjs/motion';

const sequence = new AnimationSequence();

// Chain animations
sequence
  .to(element1, { opacity: 1, y: 0 }, { config: SpringPresets.gentle })
  .to(element2, { opacity: 1, x: 0 }, { config: SpringPresets.snappy })
  .to(element3, { scale: 1 });

// Play sequence (animations run one after another)
await sequence.play();

// Reset for replay
sequence.reset();
```

### Staggered Animations

```typescript
const items = document.querySelectorAll('.list-item');

const sequence = new AnimationSequence();

// Stagger: 50ms delay between each element
sequence.to(
  Array.from(items),
  { opacity: 1, y: 0 },
  { stagger: 50, config: SpringPresets.gentle }
);

await sequence.play();
```

## Easing Functions

```typescript
import { Easing } from '@philjs/motion';

// Available easing functions
Easing.linear(t);       // Linear
Easing.easeInQuad(t);   // Accelerate
Easing.easeOutQuad(t);  // Decelerate
Easing.easeInOutQuad(t); // Accelerate then decelerate

Easing.easeInCubic(t);
Easing.easeOutCubic(t);
Easing.easeInOutCubic(t);

Easing.easeInElastic(t);  // Elastic in
Easing.easeOutElastic(t); // Elastic out

Easing.easeOutBounce(t);  // Bounce effect
```

## React Hooks

### useSpring

```typescript
import { useSpring } from '@philjs/motion';

function AnimatedCounter() {
  const { value, set, setImmediate } = useSpring(0, SpringPresets.snappy);

  return (
    <div>
      <span style={{ transform: `translateX(${value}px)` }}>
        Moving Element
      </span>
      <button onClick={() => set(100)}>Animate</button>
      <button onClick={() => setImmediate(0)}>Reset</button>
    </div>
  );
}
```

### useSpringVector

```typescript
import { useSpringVector } from '@philjs/motion';

function AnimatedBox() {
  const { values, set } = useSpringVector(
    { x: 0, y: 0, scale: 1 },
    SpringPresets.bouncy
  );

  return (
    <div
      style={{
        transform: `translate(${values.x}px, ${values.y}px) scale(${values.scale})`,
      }}
      onMouseEnter={() => set({ scale: 1.1 })}
      onMouseLeave={() => set({ scale: 1 })}
    >
      Hover me
    </div>
  );
}
```

### useAnimatedTransform

```typescript
import { useAnimatedTransform } from '@philjs/motion';
import { useRef } from 'preact/hooks';

function AnimatedCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { animate, set } = useAnimatedTransform(ref, { scale: 1 });

  return (
    <div
      ref={ref}
      onMouseEnter={() => animate({ scale: 1.05, rotate: 2 })}
      onMouseLeave={() => animate({ scale: 1, rotate: 0 })}
    >
      Hover to animate
    </div>
  );
}
```

### useGesture

```typescript
import { useGesture } from '@philjs/motion';
import { useRef } from 'preact/hooks';

function DraggableCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { state, setBounds, animateTo, reset } = useGesture(ref);

  useEffect(() => {
    setBounds({ minX: -200, maxX: 200, minY: -100, maxY: 100 });
  }, []);

  return (
    <div ref={ref} class="draggable">
      <p>Drag me! Position: ({state.x}, {state.y})</p>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### useScrollAnimation

```typescript
import { useScrollAnimation } from '@philjs/motion';
import { useRef } from 'preact/hooks';

function ParallaxSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, scrollInfo } = useScrollAnimation(ref);

  return (
    <div ref={ref} style={{ opacity: progress }}>
      <p>Scroll progress: {Math.round(progress * 100)}%</p>
      <p>Direction: {scrollInfo?.direction}</p>
    </div>
  );
}
```

### useFlip

```typescript
import { useFlip } from '@philjs/motion';
import { useRef, useState } from 'preact/hooks';

function ExpandableCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { snapshot, animate } = useFlip(ref);
  const [expanded, setExpanded] = useState(false);

  const toggle = async () => {
    snapshot();           // Record current position
    setExpanded(!expanded); // Change state (triggers layout)
    await animate();      // Animate from old to new
  };

  return (
    <div
      ref={ref}
      class={expanded ? 'card expanded' : 'card'}
      onClick={toggle}
    >
      Click to {expanded ? 'collapse' : 'expand'}
    </div>
  );
}
```

## Types Reference

```typescript
// Spring configuration
interface SpringConfig {
  tension?: number;    // Spring stiffness (default: 170)
  friction?: number;   // Damping (default: 26)
  mass?: number;       // Object mass (default: 1)
  velocity?: number;   // Initial velocity (default: 0)
  precision?: number;  // Stop threshold (default: 0.01)
  clamp?: boolean;     // Prevent overshooting (default: false)
}

// Animation state (passed to callbacks)
interface AnimationState {
  isAnimating: boolean;
  progress: number;    // 0-1 progress to target
  velocity: number;    // Current velocity
}

// Transform values for AnimatedTransform
interface TransformValues {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  skewX?: number;
  skewY?: number;
  opacity?: number;
}

// Gesture state
interface GestureState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  isDragging: boolean;
  isPinching: boolean;
  scale: number;
  rotation: number;
}

// Scroll info
interface ScrollInfo {
  x: number;
  y: number;
  progress: number;
  velocity: number;
  direction: 'up' | 'down' | 'left' | 'right' | null;
}

// Layout rect for FLIP
interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `Spring` | Single-value spring animation |
| `SpringVector` | Multi-dimensional spring animation |
| `AnimatedTransform` | GPU-accelerated transform animations |
| `FlipAnimation` | FLIP layout animations |
| `GestureAnimation` | Drag and gesture handling |
| `ScrollAnimation` | Scroll-linked animations |
| `AnimationSequence` | Orchestrated animation sequences |

### Hooks

| Hook | Description |
|------|-------------|
| `useSpring(initial, config)` | Single spring value |
| `useSpringVector(initial, config)` | Multiple spring values |
| `useAnimatedTransform(ref, initial, config)` | Element transforms |
| `useGesture(ref, config)` | Drag and gesture handling |
| `useScrollAnimation(ref, options)` | Scroll progress tracking |
| `useFlip(ref, config)` | FLIP layout animation |

### Constants

| Export | Description |
|--------|-------------|
| `SpringPresets` | Pre-configured spring settings |
| `Easing` | Easing functions |

## Examples

### Card Hover Effect

```typescript
import { AnimatedTransform, SpringPresets } from '@philjs/motion';

const cards = document.querySelectorAll('.card');

cards.forEach(card => {
  const transform = new AnimatedTransform(card, {}, SpringPresets.snappy);

  card.addEventListener('mouseenter', () => {
    transform.animate({ scale: 1.05, y: -10 });
  });

  card.addEventListener('mouseleave', () => {
    transform.animate({ scale: 1, y: 0 });
  });
});
```

### Swipeable Cards

```typescript
import { GestureAnimation, SpringPresets } from '@philjs/motion';

const card = document.querySelector('.swipeable');
const gesture = new GestureAnimation(card, SpringPresets.stiff);

gesture.onDragEnd((state) => {
  const threshold = 100;

  if (state.x > threshold) {
    // Swiped right - accept
    gesture.animateTo(500, 0);
    setTimeout(() => removeCard(), 300);
  } else if (state.x < -threshold) {
    // Swiped left - reject
    gesture.animateTo(-500, 0);
    setTimeout(() => removeCard(), 300);
  } else {
    // Snap back
    gesture.reset();
  }
});
```

### Staggered List Animation

```typescript
import { AnimationSequence, SpringPresets } from '@philjs/motion';

function animateListIn(items: HTMLElement[]) {
  // Start hidden
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
