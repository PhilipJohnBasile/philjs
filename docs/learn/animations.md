# Animations and Transitions

PhilJS makes it easy to create smooth, performant animations. This guide covers everything from simple CSS transitions to complex spring animations.


## CSS Transitions

The simplest way to add motion to your UI:

```tsx
import { signal } from '@philjs/core';

function FadeIn() {
  const isVisible = signal(false);

  return (
    <div>
      <button onClick={() => isVisible.set(!isVisible())}>
        Toggle
      </button>

      <div
        style={{
          opacity: isVisible() ? 1 : 0,
          transition: 'opacity 300ms ease-in-out',
          padding: '20px',
          background: '#f0f0f0'
        }}
      >
        This fades in and out
      </div>
    </div>
  );
}
```

### Transform Transitions

```tsx
import { signal } from '@philjs/core';

function SlideIn() {
  const isOpen = signal(false);

  return (
    <div>
      <button onClick={() => isOpen.set(!isOpen())}>
        {isOpen() ? 'Close' : 'Open'} Panel
      </button>

      <div
        style={{
          transform: isOpen() ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          width: '300px',
          height: '100vh',
          background: '#333',
          color: 'white',
          padding: '20px'
        }}
      >
        <h2>Slide Panel</h2>
        <p>This slides in from the left</p>
      </div>
    </div>
  );
}
```

### Multiple Properties

```tsx
import { signal } from '@philjs/core';

function Card() {
  const isHovered = signal(false);

  return (
    <div
      onMouseEnter={() => isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
      style={{
        transform: isHovered() ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
        boxShadow: isHovered()
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'all 200ms ease-out',
        padding: '20px',
        borderRadius: '8px',
        background: 'white',
        cursor: 'pointer'
      }}
    >
      <h3>Hover me!</h3>
      <p>I scale up and lift when you hover</p>
    </div>
  );
}
```

## CSS Animations

For more complex animations, use CSS keyframes:

```tsx
import { signal } from '@philjs/core';

function Spinner() {
  return (
    <div
      style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );
}

// In your CSS file:
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }
```

### Bounce Animation

```tsx
function BounceButton() {
  const isClicked = signal(false);

  const handleClick = () => {
    isClicked.set(true);
    setTimeout(() => isClicked.set(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        animation: isClicked() ? 'bounce 600ms ease-out' : 'none',
        padding: '12px 24px',
        fontSize: '16px',
        borderRadius: '8px',
        border: 'none',
        background: '#3498db',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      Click me!
    </button>
  );
}

// CSS:
// @keyframes bounce {
//   0%, 100% { transform: translateY(0); }
//   25% { transform: translateY(-20px); }
//   50% { transform: translateY(-10px); }
//   75% { transform: translateY(-5px); }
// }
```

## JavaScript Animations

For precise control, use JavaScript-based animations:

```tsx
import { signal, effect, onCleanup } from '@philjs/core';

function CounterAnimation() {
  const displayValue = signal(0);
  const targetValue = signal(0);

  effect(() => {
    const target = targetValue();
    const current = displayValue();

    if (current === target) return;

    const duration = 1000;
    const steps = 60;
    const increment = (target - current) / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        displayValue.set(target);
        clearInterval(interval);
      } else {
        displayValue.set(current + increment * step);
      }
    }, duration / steps);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div>
      <h2>{Math.round(displayValue())}</h2>
      <button onClick={() => targetValue.set(targetValue() + 100)}>
        Add 100
      </button>
    </div>
  );
}
```

### Easing Functions

```tsx
// Easing functions
const easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
};

function AnimatedProgress() {
  const progress = signal(0);

  const animate = (to: number, duration: number = 1000) => {
    const start = progress();
    const startTime = Date.now();

    const update = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = easing.easeOutCubic(t);

      progress.set(start + (to - start) * easedT);

      if (t < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  return (
    <div>
      <div
        style={{
          width: '100%',
          height: '20px',
          background: '#f0f0f0',
          borderRadius: '10px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${progress()}%`,
            height: '100%',
            background: '#3498db',
            transition: 'width 50ms linear'
          }}
        />
      </div>
      <button onClick={() => animate(100)}>Animate to 100%</button>
      <button onClick={() => animate(0)}>Reset</button>
    </div>
  );
}
```

## Spring Animations

Natural, physics-based motion:

```tsx
import { signal, effect } from '@philjs/core';

function useSpring(target: number, config = { stiffness: 170, damping: 26 }) {
  const value = signal(target);
  const velocity = signal(0);

  effect(() => {
    const targetVal = target;
    let currentValue = value();
    let currentVelocity = velocity();

    const update = () => {
      const delta = targetVal - currentValue;
      const spring = delta * config.stiffness;
      const damper = currentVelocity * config.damping;

      const acceleration = spring - damper;
      currentVelocity += acceleration * 0.016; // ~60fps
      currentValue += currentVelocity * 0.016;

      value.set(currentValue);
      velocity.set(currentVelocity);

      if (Math.abs(delta) > 0.01 || Math.abs(currentVelocity) > 0.01) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  });

  return value;
}

function SpringDemo() {
  const target = signal(0);
  const animated = useSpring(target());

  return (
    <div>
      <div
        style={{
          transform: `translateX(${animated()}px)`,
          width: '50px',
          height: '50px',
          background: '#3498db',
          borderRadius: '8px'
        }}
      />
      <button onClick={() => target.set(target() + 100)}>
        Move Right
      </button>
      <button onClick={() => target.set(0)}>Reset</button>
    </div>
  );
}
```

## List Animations

Animate items entering and leaving lists:

```tsx
import { signal } from '@philjs/core';

function AnimatedList() {
  const items = signal([1, 2, 3]);
  const nextId = signal(4);

  const addItem = () => {
    items.set([...items(), nextId()]);
    nextId.set(nextId() + 1);
  };

  const removeItem = (id: number) => {
    items.set(items().filter(item => item !== id));
  };

  return (
    <div>
      <button onClick={addItem}>Add Item</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items().map((item) => (
          <div
            key={item}
            style={{
              animation: 'slideIn 300ms ease-out',
              padding: '12px',
              background: '#f0f0f0',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Item {item}</span>
            <button onClick={() => removeItem(item)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// CSS:
// @keyframes slideIn {
//   from {
//     opacity: 0;
//     transform: translateY(-20px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }
```

### Staggered Animations

```tsx
import { signal, For } from '@philjs/core';

function StaggeredList() {
  const items = signal(['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']);

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {items().map((item, index) => (
        <li
          key={item}
          style={{
            animation: `fadeInUp 500ms ease-out ${index * 100}ms both`,
            padding: '12px',
            background: '#f0f0f0',
            marginBottom: '8px',
            borderRadius: '4px'
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

// CSS:
// @keyframes fadeInUp {
//   from {
//     opacity: 0;
//     transform: translateY(20px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }
```

## Page Transitions

Smooth transitions between routes:

```tsx
import { useLocation } from '@philjs/router';
import { signal, effect } from '@philjs/core';

function PageTransition({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const isTransitioning = signal(false);

  effect(() => {
    const path = location.pathname;

    isTransitioning.set(true);

    setTimeout(() => {
      isTransitioning.set(false);
    }, 300);
  });

  return (
    <div
      style={{
        animation: isTransitioning()
          ? 'fadeOut 150ms ease-out'
          : 'fadeIn 150ms ease-in',
      }}
    >
      {children}
    </div>
  );
}

// CSS:
// @keyframes fadeOut {
//   to { opacity: 0; }
// }
// @keyframes fadeIn {
//   from { opacity: 0; }
// }
```

## View Transitions API

Use the browser's native View Transitions API:

```tsx
import { useNavigate } from '@philjs/router';

function ViewTransitionDemo() {
  const navigate = useNavigate();

  const transitionToPage = async (path: string) => {
    if (!document.startViewTransition) {
      navigate(path);
      return;
    }

    await document.startViewTransition(() => {
      navigate(path);
    }).finished;
  };

  return (
    <button onClick={() => transitionToPage('/about')}>
      Go to About (with transition)
    </button>
  );
}
```

## Gesture Animations

Respond to touch and drag:

```tsx
import { signal } from '@philjs/core';

function DraggableCard() {
  const position = signal({ x: 0, y: 0 });
  const isDragging = signal(false);
  const startPos = signal({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.set(true);
    startPos.set({
      x: e.clientX - position().x,
      y: e.clientY - position().y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;

    position.set({
      x: e.clientX - startPos().x,
      y: e.clientY - startPos().y
    });
  };

  const handleMouseUp = () => {
    isDragging.set(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        transform: `translate(${position().x}px, ${position().y}px)`,
        transition: isDragging() ? 'none' : 'transform 200ms ease-out',
        padding: '20px',
        background: '#3498db',
        color: 'white',
        borderRadius: '8px',
        cursor: isDragging() ? 'grabbing' : 'grab',
        userSelect: 'none',
        display: 'inline-block'
      }}
    >
      Drag me around!
    </div>
  );
}
```

## Performance Tips

### Use CSS Transforms

```tsx
// ✅ Good - GPU accelerated
<div style={{ transform: 'translateX(100px)' }} />

// ❌ Bad - causes layout recalculation
<div style={{ left: '100px' }} />
```

### Use will-change for Complex Animations

```tsx
<div
  style={{
    willChange: isAnimating() ? 'transform' : 'auto',
    transform: `scale(${scale()})`,
    transition: 'transform 300ms'
  }}
/>
```

### Avoid Animating Layout Properties

```tsx
// ❌ Avoid: width, height, top, left, margin, padding
// ✅ Use: transform, opacity
```

## Animation Libraries

### Using Framer Motion

```tsx
import { motion } from 'framer-motion';

function FramerExample() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      Animated with Framer Motion
    </motion.div>
  );
}
```

### Using GSAP

```tsx
import { effect, onCleanup } from '@philjs/core';
import gsap from 'gsap';

function GSAPExample() {
  let boxRef: HTMLDivElement;

  effect(() => {
    const animation = gsap.to(boxRef, {
      x: 100,
      rotation: 360,
      duration: 2,
      repeat: -1,
      yoyo: true
    });

    onCleanup(() => animation.kill());
  });

  return <div ref={boxRef} style={{ width: '100px', height: '100px', background: 'red' }} />;
}
```

## Next Steps

- [Styling](/docs/learn/styling.md) - Style your components
- [Performance](/docs/learn/performance.md) - Optimize animations
- [View Transitions](/docs/routing/view-transitions.md) - Route transitions

---

💡 **Tip**: Use `transform` and `opacity` for the smoothest animations. They're GPU-accelerated!

⚠️ **Warning**: Animating layout properties (width, height, margin) causes expensive reflows. Use transforms instead.

ℹ️ **Note**: The browser's View Transitions API provides native page transitions with zero JavaScript overhead.
