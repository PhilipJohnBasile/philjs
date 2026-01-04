# Animation Hooks

`@philjs/motion` provides a suite of React/Preact hooks for seamlessly integrating spring physics animations into your components. These hooks handle lifecycle management, cleanup, and state synchronization automatically.

## Overview

| Hook | Purpose | Key Features |
|------|---------|--------------|
| `useSpring` | Single animated value | Simple, direct spring control |
| `useSpringVector` | Multiple animated values | Coordinate multi-dimensional animation |
| `useAnimatedTransform` | Element transforms | Direct DOM manipulation |
| `useGesture` | Drag and gesture handling | Touch/mouse input handling |
| `useScrollAnimation` | Scroll-linked effects | Progress tracking |
| `useFlip` | Layout animations | FLIP technique automation |

## useSpring

Animate a single numeric value with spring physics.

### API

```typescript
const { value, set, setImmediate } = useSpring(
  initialValue: number,
  config?: SpringConfig
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | Current animated value |
| `set` | `(target: number) => Promise<void>` | Animate to target |
| `setImmediate` | `(target: number) => void` | Set without animation |

### Basic Example

```typescript
import { useSpring, SpringPresets } from '@philjs/motion';

function AnimatedProgress() {
  const { value, set } = useSpring(0, SpringPresets.gentle);

  return (
    <div>
      <div
        class="progress-bar"
        style={{ width: `${value}%` }}
      />
      <button onClick={() => set(100)}>Complete</button>
      <button onClick={() => set(0)}>Reset</button>
    </div>
  );
}
```

### Animated Counter

```typescript
function AnimatedCounter({ target }: { target: number }) {
  const { value, set } = useSpring(0, SpringPresets.stiff);

  useEffect(() => {
    set(target);
  }, [target]);

  return (
    <span class="counter">
      {Math.round(value)}
    </span>
  );
}
```

### Smooth Slider

```typescript
function SmoothSlider() {
  const { value, set, setImmediate } = useSpring(50);

  const handleChange = (e: Event) => {
    const newValue = Number((e.target as HTMLInputElement).value);
    set(newValue); // Smooth animation to new value
  };

  const handleDragEnd = (e: Event) => {
    // Snap to nearest 10
    const snapped = Math.round(value / 10) * 10;
    set(snapped);
  };

  return (
    <div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={handleChange}
        onMouseUp={handleDragEnd}
      />
      <span>{Math.round(value)}</span>
    </div>
  );
}
```

## useSpringVector

Animate multiple values simultaneously with coordinated spring physics.

### API

```typescript
const { values, set } = useSpringVector(
  initial: Record<string, number>,
  config?: SpringConfig
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `values` | `Record<string, number>` | Current values object |
| `set` | `(values: Record<string, number>) => Promise<void[]>` | Animate to targets |

### Basic Example

```typescript
import { useSpringVector, SpringPresets } from '@philjs/motion';

function HoverCard() {
  const { values, set } = useSpringVector(
    { x: 0, y: 0, scale: 1 },
    SpringPresets.snappy
  );

  return (
    <div
      class="card"
      style={{
        transform: `translate(${values.x}px, ${values.y}px) scale(${values.scale})`,
      }}
      onMouseEnter={() => set({ scale: 1.05, y: -5 })}
      onMouseLeave={() => set({ scale: 1, y: 0 })}
    >
      Hover me!
    </div>
  );
}
```

### 3D Card Tilt

```typescript
function TiltCard() {
  const { values, set } = useSpringVector(
    { rotateX: 0, rotateY: 0, scale: 1 },
    { tension: 300, friction: 20 }
  );

  const handleMouseMove = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.5) * -20;
    const rotateY = ((x / rect.width) - 0.5) * 20;

    set({ rotateX, rotateY, scale: 1.05 });
  };

  const handleMouseLeave = () => {
    set({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  return (
    <div
      class="tilt-card"
      style={{
        transform: `
          perspective(1000px)
          rotateX(${values.rotateX}deg)
          rotateY(${values.rotateY}deg)
          scale(${values.scale})
        `,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      Interactive 3D Card
    </div>
  );
}
```

### Color Transition

```typescript
function ColorBox() {
  const { values, set } = useSpringVector(
    { r: 100, g: 150, b: 200 },
    SpringPresets.gentle
  );

  const randomColor = () => set({
    r: Math.random() * 255,
    g: Math.random() * 255,
    b: Math.random() * 255,
  });

  return (
    <div
      class="color-box"
      style={{
        backgroundColor: `rgb(${values.r}, ${values.g}, ${values.b})`,
      }}
      onClick={randomColor}
    >
      Click for random color
    </div>
  );
}
```

## useAnimatedTransform

Apply spring-animated transforms directly to a DOM element.

### API

```typescript
const { animate, set } = useAnimatedTransform(
  elementRef: RefObject<HTMLElement>,
  initial?: TransformValues,
  config?: SpringConfig
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `animate` | `(values: TransformValues) => Promise<void[]>` | Animate to values |
| `set` | `(values: TransformValues) => void` | Set immediately |

### Basic Example

```typescript
import { useAnimatedTransform, SpringPresets } from '@philjs/motion';
import { useRef } from 'preact/hooks';

function AnimatedBox() {
  const ref = useRef<HTMLDivElement>(null);
  const { animate, set } = useAnimatedTransform(ref, {
    scale: 1,
    rotate: 0,
  }, SpringPresets.bouncy);

  return (
    <div
      ref={ref}
      class="box"
      onMouseEnter={() => animate({ scale: 1.2, rotate: 10 })}
      onMouseLeave={() => animate({ scale: 1, rotate: 0 })}
    >
      Animated Box
    </div>
  );
}
```

### Button Press Effect

```typescript
function PressableButton({ children, onClick }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { animate } = useAnimatedTransform(ref, { scale: 1 }, SpringPresets.snappy);

  const handleMouseDown = () => animate({ scale: 0.95 });
  const handleMouseUp = () => animate({ scale: 1 });

  return (
    <button
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Shake Animation

```typescript
function ShakeableInput() {
  const ref = useRef<HTMLInputElement>(null);
  const { animate, set } = useAnimatedTransform(ref, { x: 0 });

  const shake = async () => {
    await animate({ x: 10 });
    await animate({ x: -10 });
    await animate({ x: 10 });
    await animate({ x: -10 });
    await animate({ x: 0 });
  };

  const handleSubmit = () => {
    if (!ref.current?.value) {
      shake();
    }
  };

  return (
    <div>
      <input ref={ref} placeholder="Required field" />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

## useGesture

Handle drag gestures with spring physics momentum.

### API

```typescript
const { state, setBounds, animateTo, reset } = useGesture(
  elementRef: RefObject<HTMLElement>,
  config?: SpringConfig
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `state` | `GestureState` | Current gesture state |
| `setBounds` | `(bounds: Bounds) => void` | Set drag boundaries |
| `animateTo` | `(x, y) => Promise<void[]>` | Animate to position |
| `reset` | `() => Promise<void[]>` | Reset to origin |

### Basic Draggable

```typescript
import { useGesture, SpringPresets } from '@philjs/motion';
import { useRef, useEffect } from 'preact/hooks';

function DraggableBox() {
  const ref = useRef<HTMLDivElement>(null);
  const { state, setBounds, reset } = useGesture(ref, SpringPresets.stiff);

  useEffect(() => {
    setBounds({
      minX: -200,
      maxX: 200,
      minY: -100,
      maxY: 100,
    });
  }, []);

  return (
    <div class="container">
      <div ref={ref} class="draggable-box">
        Drag me!
        <br />
        Position: ({Math.round(state.x)}, {Math.round(state.y)})
      </div>
      <button onClick={() => reset()}>Reset</button>
    </div>
  );
}
```

### Swipe to Dismiss

```typescript
function SwipeableCard({ onDismiss }) {
  const ref = useRef<HTMLDivElement>(null);
  const { state, animateTo, reset } = useGesture(ref, SpringPresets.stiff);

  useEffect(() => {
    // Handle swipe completion
    const checkSwipe = () => {
      if (Math.abs(state.x) > 150 || Math.abs(state.vx) > 500) {
        const direction = state.x > 0 ? 1 : -1;
        animateTo(direction * 500, 0);
        setTimeout(() => onDismiss(direction > 0 ? 'right' : 'left'), 200);
      } else if (!state.isDragging) {
        reset();
      }
    };

    const interval = setInterval(checkSwipe, 100);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div
      ref={ref}
      class="swipeable-card"
      style={{
        opacity: 1 - Math.abs(state.x) / 300,
        transform: `rotate(${state.x * 0.05}deg)`,
      }}
    >
      Swipe left or right
    </div>
  );
}
```

### Slider with Snap Points

```typescript
function SnapSlider({ snapPoints = [0, 100, 200, 300] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { state, animateTo, setBounds } = useGesture(ref);

  useEffect(() => {
    setBounds({
      minX: snapPoints[0],
      maxX: snapPoints[snapPoints.length - 1],
      minY: 0,
      maxY: 0,
    });
  }, [snapPoints]);

  // Snap to nearest point when not dragging
  useEffect(() => {
    if (!state.isDragging) {
      const nearest = snapPoints.reduce((prev, curr) =>
        Math.abs(curr - state.x) < Math.abs(prev - state.x) ? curr : prev
      );
      animateTo(nearest, 0);
    }
  }, [state.isDragging]);

  return (
    <div class="slider-track">
      <div ref={ref} class="slider-thumb">
        {Math.round(state.x)}
      </div>
    </div>
  );
}
```

## useScrollAnimation

Track scroll progress and animate based on element visibility.

### API

```typescript
const { progress, scrollInfo } = useScrollAnimation(
  elementRef: RefObject<HTMLElement>,
  options?: { startOffset?: number; endOffset?: number }
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `progress` | `number` | 0-1 visibility progress |
| `scrollInfo` | `ScrollInfo \| null` | Detailed scroll state |

### Fade In on Scroll

```typescript
import { useScrollAnimation } from '@philjs/motion';
import { useRef } from 'preact/hooks';

function FadeInSection({ children }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress } = useScrollAnimation(ref, {
    startOffset: 0.1,
    endOffset: 0.5,
  });

  return (
    <section
      ref={ref}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 30}px)`,
      }}
    >
      {children}
    </section>
  );
}
```

### Parallax Background

```typescript
function ParallaxHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { progress } = useScrollAnimation(ref);

  return (
    <div ref={ref} class="hero">
      <div
        class="background"
        style={{
          transform: `translateY(${progress * 100}px)`,
        }}
      />
      <div class="content">
        <h1>Welcome</h1>
      </div>
    </div>
  );
}
```

### Progress Indicator

```typescript
function ReadingProgress() {
  const articleRef = useRef<HTMLElement>(null);
  const { progress } = useScrollAnimation(articleRef);

  return (
    <>
      <div class="progress-bar" style={{ width: `${progress * 100}%` }} />
      <article ref={articleRef}>
        {/* Article content */}
      </article>
    </>
  );
}
```

### Scroll Direction Indicator

```typescript
function ScrollDirectionBadge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollInfo } = useScrollAnimation(ref);

  return (
    <div ref={ref} class="container">
      <div class="badge">
        {scrollInfo?.direction === 'down' ? 'Scrolling Down' :
         scrollInfo?.direction === 'up' ? 'Scrolling Up' :
         'Not Scrolling'}
      </div>
      <div class="velocity">
        Speed: {Math.abs(scrollInfo?.velocity ?? 0).toFixed(0)} px/s
      </div>
    </div>
  );
}
```

## useFlip

Automate FLIP layout animations.

### API

```typescript
const { snapshot, animate } = useFlip(
  elementRef: RefObject<HTMLElement>,
  config?: SpringConfig
);
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `snapshot` | `() => void` | Capture current position |
| `animate` | `() => Promise<void>` | Animate from snapshot to current |

### Expandable Card

```typescript
import { useFlip, SpringPresets } from '@philjs/motion';
import { useRef, useState } from 'preact/hooks';

function ExpandableCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { snapshot, animate } = useFlip(ref, SpringPresets.snappy);
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    // 1. Capture current position
    snapshot();

    // 2. Update state (changes layout)
    setExpanded(!expanded);

    // 3. Animate from old to new position
    requestAnimationFrame(() => {
      animate();
    });
  };

  return (
    <div
      ref={ref}
      class={`card ${expanded ? 'expanded' : ''}`}
      onClick={toggle}
    >
      <h2>Click to {expanded ? 'collapse' : 'expand'}</h2>
      {expanded && (
        <p>Additional content that appears when expanded...</p>
      )}
    </div>
  );
}
```

### Reorderable List

```typescript
function ReorderableList({ items, onReorder }) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [flips, setFlips] = useState<Map<string, ReturnType<typeof useFlip>>>(new Map());

  // Capture all positions before reorder
  const prepareReorder = () => {
    flips.forEach(flip => flip.snapshot());
  };

  // Animate all items after reorder
  const animateReorder = () => {
    requestAnimationFrame(() => {
      flips.forEach(flip => flip.animate());
    });
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    prepareReorder();
    onReorder(fromIndex, toIndex);
    animateReorder();
  };

  return (
    <ul class="sortable-list">
      {items.map((item, index) => (
        <ReorderableItem
          key={item.id}
          item={item}
          onMoveUp={() => moveItem(index, index - 1)}
          onMoveDown={() => moveItem(index, index + 1)}
          ref={el => {
            if (el) itemRefs.current.set(item.id, el);
          }}
        />
      ))}
    </ul>
  );
}
```

### Photo Grid Layout Toggle

```typescript
function PhotoGrid({ photos }) {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const photoRefs = useRef<Map<string, HTMLElement>>(new Map());
  const flips = useRef<Map<string, { snapshot: () => void; animate: () => void }>>(new Map());

  const toggleLayout = () => {
    // Snapshot all photos
    flips.current.forEach(flip => flip.snapshot());

    // Change layout
    setLayout(layout === 'grid' ? 'list' : 'grid');

    // Animate all photos
    requestAnimationFrame(() => {
      flips.current.forEach(flip => flip.animate());
    });
  };

  return (
    <div>
      <button onClick={toggleLayout}>
        Switch to {layout === 'grid' ? 'List' : 'Grid'}
      </button>
      <div class={`photo-container ${layout}`}>
        {photos.map(photo => (
          <FlipPhoto
            key={photo.id}
            photo={photo}
            ref={el => {
              if (el) photoRefs.current.set(photo.id, el);
            }}
            onFlipReady={flip => flips.current.set(photo.id, flip)}
          />
        ))}
      </div>
    </div>
  );
}
```

## Composing Hooks

Combine multiple hooks for complex interactions:

```typescript
function InteractiveCard() {
  const ref = useRef<HTMLDivElement>(null);

  // Spring for hover effect
  const { values: hoverValues, set: setHover } = useSpringVector(
    { scale: 1, rotateX: 0, rotateY: 0 },
    SpringPresets.snappy
  );

  // Gesture for drag
  const { state: gestureState, reset } = useGesture(ref);

  // Scroll-based fade
  const { progress } = useScrollAnimation(ref);

  // Combined transform
  const transform = `
    translate(${gestureState.x}px, ${gestureState.y}px)
    scale(${hoverValues.scale})
    rotateX(${hoverValues.rotateX}deg)
    rotateY(${hoverValues.rotateY}deg)
  `;

  return (
    <div
      ref={ref}
      style={{
        transform,
        opacity: progress,
      }}
      onMouseEnter={() => setHover({ scale: 1.05 })}
      onMouseLeave={() => setHover({ scale: 1, rotateX: 0, rotateY: 0 })}
    >
      Interactive Card
    </div>
  );
}
```

## Cleanup and Memory Management

All hooks automatically clean up on unmount:

```typescript
function Component() {
  const ref = useRef<HTMLDivElement>(null);

  // These are all automatically cleaned up when component unmounts
  const spring = useSpring(0);
  const vector = useSpringVector({ x: 0, y: 0 });
  const transform = useAnimatedTransform(ref);
  const gesture = useGesture(ref);
  const scroll = useScrollAnimation(ref);
  const flip = useFlip(ref);

  // No manual cleanup needed!
  return <div ref={ref}>Content</div>;
}
```

## Next Steps

- [Spring Physics Deep Dive](./spring-physics.md)
- [Gesture-Driven Animations](./gestures.md)
- [Scroll-Linked Animations](./scroll-animations.md)
- [FLIP Layout Animations](./flip-animations.md)
- [Animation Sequences](./sequences.md)
