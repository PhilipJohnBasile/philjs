# Styling Animations

Create smooth, performant animations with CSS transitions, keyframes, JavaScript animations, and the View Transitions API.

## What You'll Learn

- CSS transitions with signals
- CSS keyframe animations
- JavaScript-based animations
- Spring physics animations
- View Transitions API
- Animation library integration
- Performance optimization
- Best practices

## CSS Transitions with Signals

PhilJS signals work seamlessly with CSS transitions for reactive, declarative animations.

### Basic Fade Transition

```tsx
import { signal } from '@philjs/core';

export default function FadeButton() {
  const isHovered = signal(false);

  return (
    <button
      onMouseEnter={() => isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
      style={{
        opacity: isHovered() ? 1 : 0.7,
        transform: isHovered() ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease-out'
      }}
    >
      Hover Me
    </button>
  );
}
```

### Multiple Property Transitions

```tsx
import { signal } from '@philjs/core';

function InteractiveCard() {
  const isActive = signal(false);

  return (
    <div
      onClick={() => isActive.set(!isActive())}
      style={{
        transform: isActive()
          ? 'scale(1.05) translateY(-8px) rotate(2deg)'
          : 'scale(1) translateY(0) rotate(0)',
        boxShadow: isActive()
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        borderColor: isActive() ? '#3b82f6' : '#e5e7eb',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '24px',
        borderRadius: '12px',
        border: '2px solid',
        background: 'white',
        cursor: 'pointer'
      }}
    >
      <h3>Interactive Card</h3>
      <p>Click to activate</p>
    </div>
  );
}
```

### Conditional Transitions

```tsx
import { signal } from '@philjs/core';

function ConditionalTransition() {
  const isVisible = signal(false);
  const shouldAnimate = signal(true);

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={shouldAnimate()}
          onChange={(e) => shouldAnimate.set(e.target.checked)}
        />
        Enable animations
      </label>

      <button onClick={() => isVisible.set(!isVisible())}>
        Toggle
      </button>

      <div
        style={{
          opacity: isVisible() ? 1 : 0,
          transform: isVisible() ? 'translateY(0)' : 'translateY(-20px)',
          transition: shouldAnimate()
            ? 'opacity 300ms ease-out, transform 300ms ease-out'
            : 'none',
          padding: '20px',
          background: '#f0f0f0',
          marginTop: '16px'
        }}
      >
        Content with conditional animation
      </div>
    </div>
  );
}
```

### Staggered List Animations

```tsx
import { signal } from '@philjs/core';

function StaggeredList() {
  const items = signal(['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']);
  const isVisible = signal(false);

  return (
    <div>
      <button onClick={() => isVisible.set(!isVisible())}>
        {isVisible() ? 'Hide' : 'Show'} List
      </button>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
        {items().map((item, index) => (
          <li
            key={item}
            style={{
              opacity: isVisible() ? 1 : 0,
              transform: isVisible()
                ? 'translateX(0)'
                : 'translateX(-20px)',
              transition: `all 300ms ease-out ${index * 50}ms`,
              padding: '12px',
              background: '#f0f0f0',
              marginBottom: '8px',
              borderRadius: '6px'
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## CSS Keyframe Animations

For complex, multi-step animations, use CSS keyframes.

### Slide In Animation

```css
/* styles.css */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.bounce {
  animation: bounce 0.6s ease-in-out;
}
```

```tsx
import { signal } from '@philjs/core';
import './styles.css';

export default function KeyframeDemo() {
  const isSlideVisible = signal(false);
  const isSpinning = signal(false);
  const isBouncing = signal(false);

  const triggerBounce = () => {
    isBouncing.set(true);
    setTimeout(() => isBouncing.set(false), 600);
  };

  return (
    <div>
      <button onClick={() => isSlideVisible.set(!isSlideVisible())}>
        Toggle Slide
      </button>

      {isSlideVisible() && (
        <div class="slide-in" style={{ padding: '20px', background: '#e0f2fe' }}>
          Content slides in!
        </div>
      )}

      <button onClick={() => isSpinning.set(!isSpinning())}>
        {isSpinning() ? 'Stop' : 'Start'} Spinner
      </button>

      {isSpinning() && (
        <div
          class="spinner"
          style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3b82f6',
            borderRadius: '50%'
          }}
        />
      )}

      <button onClick={triggerBounce}>
        Bounce
      </button>

      <div
        class={isBouncing() ? 'bounce' : ''}
        style={{
          width: '60px',
          height: '60px',
          background: '#3b82f6',
          borderRadius: '8px'
        }}
      />
    </div>
  );
}
```

### Pulse Animation

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## JavaScript Animations

For fine-grained control, use JavaScript with requestAnimationFrame.

### Smooth Counter Animation

```tsx
import { signal, effect } from '@philjs/core';

export default function AnimatedCounter() {
  const count = signal(0);
  const displayCount = signal(0);

  effect(() => {
    const target = count();
    const start = displayCount();
    const duration = 1000;
    const startTime = Date.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      displayCount.set(start + (target - start) * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  });

  return (
    <div>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>
        {Math.round(displayCount())}
      </h1>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => count.set(count() + 100)}>+100</button>
        <button onClick={() => count.set(count() - 100)}>-100</button>
        <button onClick={() => count.set(0)}>Reset</button>
      </div>
    </div>
  );
}
```

### Progress Bar Animation

```tsx
import { signal, effect } from '@philjs/core';

function AnimatedProgressBar() {
  const progress = signal(0);
  const displayProgress = signal(0);

  effect(() => {
    const target = progress();
    const start = displayProgress();
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const easedT = 1 - Math.pow(1 - t, 3);

      displayProgress.set(start + (target - start) * easedT);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  });

  return (
    <div>
      <div
        style={{
          width: '100%',
          height: '24px',
          background: '#e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${displayProgress()}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            transition: 'background 200ms ease-out'
          }}
        />
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={() => progress.set(25)}>25%</button>
        <button onClick={() => progress.set(50)}>50%</button>
        <button onClick={() => progress.set(75)}>75%</button>
        <button onClick={() => progress.set(100)}>100%</button>
      </div>
    </div>
  );
}
```

## Spring Physics Animations

PhilJS includes built-in spring physics for natural, bouncy animations.

### Using createAnimatedValue

```tsx
import { signal, effect } from '@philjs/core';
import { createAnimatedValue } from '@philjs/core';

function SpringDemo() {
  const position = createAnimatedValue(0);
  const targetX = signal(0);

  const moveRight = () => {
    const newX = targetX() + 100;
    targetX.set(newX);
    position.set(newX, {
      easing: {
        stiffness: 0.15,
        damping: 0.8,
        mass: 1
      }
    });
  };

  const reset = () => {
    targetX.set(0);
    position.set(0, {
      easing: {
        stiffness: 0.15,
        damping: 0.8
      }
    });
  };

  return (
    <div>
      <div
        style={{
          transform: `translateX(${position.value}px)`,
          width: '60px',
          height: '60px',
          background: '#3b82f6',
          borderRadius: '12px'
        }}
      />

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={moveRight}>Move Right</button>
        <button onClick={reset}>Reset</button>
      </div>

      <p>
        Position: {Math.round(position.value)}px
        {position.isAnimating && ' (animating...)'}
      </p>
    </div>
  );
}
```

### Custom Spring Configurations

```tsx
import { createAnimatedValue } from '@philjs/core';

function SpringConfigs() {
  // Stiff spring - quick, snappy
  const stiff = createAnimatedValue(0);

  // Bouncy spring - oscillates
  const bouncy = createAnimatedValue(0);

  // Slow spring - smooth, gradual
  const slow = createAnimatedValue(0);

  const animate = () => {
    stiff.set(200, {
      easing: { stiffness: 0.3, damping: 0.9 }
    });

    bouncy.set(200, {
      easing: { stiffness: 0.2, damping: 0.5 }
    });

    slow.set(200, {
      easing: { stiffness: 0.05, damping: 0.8 }
    });
  };

  const reset = () => {
    stiff.set(0);
    bouncy.set(0);
    slow.set(0);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <p>Stiff Spring</p>
        <div
          style={{
            transform: `translateX(${stiff.value}px)`,
            width: '40px',
            height: '40px',
            background: '#ef4444',
            borderRadius: '8px'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p>Bouncy Spring</p>
        <div
          style={{
            transform: `translateX(${bouncy.value}px)`,
            width: '40px',
            height: '40px',
            background: '#3b82f6',
            borderRadius: '8px'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p>Slow Spring</p>
        <div
          style={{
            transform: `translateX(${slow.value}px)`,
            width: '40px',
            height: '40px',
            background: '#10b981',
            borderRadius: '8px'
          }}
        />
      </div>

      <button onClick={animate}>Animate</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## View Transitions API

Use the browser's native View Transitions API for smooth page transitions.

### Basic Page Transition

```tsx
import { useRouter } from '@philjs/router';

function Navigation() {
  const router = useRouter();

  const navigateWithTransition = async (href: string) => {
    // Feature detection
    if (!document.startViewTransition) {
      router.push(href);
      return;
    }

    // Start view transition
    await document.startViewTransition(() => {
      router.push(href);
    }).finished;
  };

  return (
    <nav>
      <button onClick={() => navigateWithTransition('/about')}>
        About
      </button>
      <button onClick={() => navigateWithTransition('/products')}>
        Products
      </button>
    </nav>
  );
}
```

### Custom Transition Styles

```css
/* Default cross-fade */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* Slide transition */
@keyframes slide-from-right {
  from {
    transform: translateX(100%);
  }
}

@keyframes slide-to-left {
  to {
    transform: translateX(-100%);
  }
}

::view-transition-old(root) {
  animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
}

::view-transition-new(root) {
  animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
}

/* Scale transition */
@keyframes scale-down {
  to {
    transform: scale(0.9);
    opacity: 0;
  }
}

@keyframes scale-up {
  from {
    transform: scale(1.1);
    opacity: 0;
  }
}

[data-transition="scale"] ::view-transition-old(root) {
  animation: 0.25s ease-out both scale-down;
}

[data-transition="scale"] ::view-transition-new(root) {
  animation: 0.25s ease-out both scale-up;
}
```

### Shared Element Transitions

```tsx
// Product List Page
function ProductList() {
  const products = getProducts();

  return (
    <div className="product-grid">
      {products.map(product => (
        <Link href={`/products/${product.id}`} key={product.id}>
          <img
            src={product.image}
            alt={product.name}
            style={{ viewTransitionName: `product-${product.id}` }}
          />
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </Link>
      ))}
    </div>
  );
}

// Product Detail Page
function ProductDetail() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);

  return (
    <div>
      <img
        src={product.image}
        alt={product.name}
        style={{ viewTransitionName: `product-${product.id}` }}
        className="product-hero"
      />
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

### Progressive Enhancement

```tsx
import { signal } from '@philjs/core';

const supportsViewTransitions = signal(
  typeof document !== 'undefined' && 'startViewTransition' in document
);

function TransitionWrapper({ children }: { children: any }) {
  const router = useRouter();

  const navigate = async (href: string) => {
    if (supportsViewTransitions()) {
      await document.startViewTransition(() => {
        router.push(href);
      }).finished;
    } else {
      // Fallback: CSS transition
      document.body.style.opacity = '0';
      await new Promise(resolve => setTimeout(resolve, 150));
      router.push(href);
      document.body.style.opacity = '1';
    }
  };

  return children;
}
```

## Animation Library Integration

PhilJS works seamlessly with popular animation libraries.

### Framer Motion

```bash
npm install framer-motion
```

```tsx
import { motion } from 'framer-motion';
import { signal } from '@philjs/core';

function FramerMotionExample() {
  const isVisible = signal(false);

  return (
    <div>
      <button onClick={() => isVisible.set(!isVisible())}>
        Toggle
      </button>

      {isVisible() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{
            padding: '24px',
            background: '#e0f2fe',
            borderRadius: '8px'
          }}
        >
          Animated with Framer Motion
        </motion.div>
      )}
    </div>
  );
}

// List animations
function FramerList() {
  const items = signal(['Item 1', 'Item 2', 'Item 3']);

  return (
    <motion.ul layout>
      {items().map((item, index) => (
        <motion.li
          key={item}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### GSAP

```bash
npm install gsap
```

```tsx
import { effect, onCleanup } from '@philjs/core';
import gsap from 'gsap';

function GSAPExample() {
  let boxRef: HTMLDivElement;

  effect(() => {
    const animation = gsap.to(boxRef, {
      x: 200,
      rotation: 360,
      duration: 2,
      ease: 'elastic.out(1, 0.3)',
      repeat: -1,
      yoyo: true
    });

    onCleanup(() => animation.kill());
  });

  return (
    <div
      ref={(el) => boxRef = el}
      style={{
        width: '100px',
        height: '100px',
        background: '#3b82f6',
        borderRadius: '8px'
      }}
    />
  );
}

// Timeline animations
function GSAPTimeline() {
  let containerRef: HTMLDivElement;

  effect(() => {
    const tl = gsap.timeline({ repeat: -1 });

    tl.to('.box-1', { x: 200, duration: 1 })
      .to('.box-2', { x: 200, duration: 1 }, '-=0.5')
      .to('.box-3', { x: 200, duration: 1 }, '-=0.5');

    onCleanup(() => tl.kill());
  });

  return (
    <div ref={(el) => containerRef = el}>
      <div className="box-1" style={boxStyle} />
      <div className="box-2" style={boxStyle} />
      <div className="box-3" style={boxStyle} />
    </div>
  );
}

const boxStyle = {
  width: '60px',
  height: '60px',
  background: '#3b82f6',
  marginBottom: '16px',
  borderRadius: '8px'
};
```

### Anime.js

```bash
npm install animejs
```

```tsx
import { effect, onCleanup } from '@philjs/core';
import anime from 'animejs';

function AnimeJSExample() {
  let elementRef: HTMLDivElement;

  effect(() => {
    const animation = anime({
      targets: elementRef,
      translateX: [
        { value: 250, duration: 1000 },
        { value: 0, duration: 1000 }
      ],
      rotate: {
        value: '1turn',
        easing: 'easeInOutSine'
      },
      scale: [
        { value: 1.5, duration: 500 },
        { value: 1, duration: 500 }
      ],
      loop: true
    });

    onCleanup(() => animation.pause());
  });

  return (
    <div
      ref={(el) => elementRef = el}
      style={{
        width: '80px',
        height: '80px',
        background: '#ec4899',
        borderRadius: '8px'
      }}
    />
  );
}
```

### Motion One

```bash
npm install motion
```

```tsx
import { effect, onCleanup } from '@philjs/core';
import { animate } from 'motion';

function MotionOneExample() {
  let elementRef: HTMLDivElement;

  effect(() => {
    const animation = animate(
      elementRef,
      {
        x: [0, 100, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.2, 1]
      },
      {
        duration: 2,
        repeat: Infinity,
        easing: 'ease-in-out'
      }
    );

    onCleanup(() => animation.cancel());
  });

  return (
    <div
      ref={(el) => elementRef = el}
      style={{
        width: '80px',
        height: '80px',
        background: '#10b981',
        borderRadius: '8px'
      }}
    />
  );
}
```

## FLIP Animations

First, Last, Invert, Play - smooth layout animations.

### Basic FLIP

```tsx
import { signal } from '@philjs/core';
import { FLIPAnimator } from '@philjs/core';

function FLIPDemo() {
  const items = signal([1, 2, 3, 4, 5]);
  const flip = new FLIPAnimator();

  const shuffle = () => {
    flip.recordPositions('[data-flip]');

    const shuffled = [...items()].sort(() => Math.random() - 0.5);
    items.set(shuffled);

    // Wait for DOM update
    requestAnimationFrame(() => {
      flip.animateChanges({ duration: 400 });
    });
  };

  return (
    <div>
      <button onClick={shuffle}>Shuffle</button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {items().map(item => (
          <div
            key={item}
            data-flip
            data-flip-id={`item-${item}`}
            style={{
              padding: '24px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Tips

### 1. Use Transform and Opacity

```tsx
// ✅ Good - GPU accelerated, no layout recalc
<div style={{
  transform: 'translateX(100px) scale(1.1)',
  opacity: 0.8
}} />

// ❌ Bad - triggers layout recalculation
<div style={{
  left: '100px',
  width: '110%'
}} />
```

### 2. Use will-change Sparingly

```tsx
import { signal } from '@philjs/core';

function OptimizedAnimation() {
  const isAnimating = signal(false);

  return (
    <div
      style={{
        // Only hint during animation
        willChange: isAnimating() ? 'transform' : 'auto',
        transform: `scale(${isAnimating() ? 1.1 : 1})`
      }}
      onTransitionStart={() => isAnimating.set(true)}
      onTransitionEnd={() => isAnimating.set(false)}
    />
  );
}
```

### 3. Avoid Animating Layout Properties

```tsx
// ❌ Avoid these (cause reflow):
// - width, height
// - top, left, right, bottom
// - margin, padding
// - border-width

// ✅ Use these instead (GPU accelerated):
// - transform (translateX/Y, scale, rotate)
// - opacity
// - filter
```

### 4. Use requestAnimationFrame

```tsx
import { signal } from '@philjs/core';

function RAFExample() {
  const position = signal(0);

  const animate = () => {
    let frame = 0;
    const maxFrames = 60;

    const step = () => {
      frame++;
      position.set((frame / maxFrames) * 100);

      if (frame < maxFrames) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  return (
    <div>
      <button onClick={animate}>Animate</button>
      <div style={{ transform: `translateX(${position()}px)` }}>
        Moving element
      </div>
    </div>
  );
}
```

### 5. Respect prefers-reduced-motion

```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

```tsx
import { signal } from '@philjs/core';

const prefersReducedMotion = signal(
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

function AccessibleAnimation() {
  const isAnimated = signal(false);

  return (
    <div
      style={{
        transform: isAnimated() ? 'scale(1.1)' : 'scale(1)',
        transition: prefersReducedMotion()
          ? 'none'
          : 'transform 300ms ease-out'
      }}
    >
      Accessible animation
    </div>
  );
}
```

### 6. Debounce Expensive Animations

```tsx
import { signal } from '@philjs/core';

function DebouncedAnimation() {
  const scrollY = signal(0);
  let timeout: number;

  const handleScroll = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      scrollY.set(window.scrollY);
    }, 16); // ~60fps
  };

  effect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  return (
    <div style={{
      transform: `translateY(${scrollY() * 0.5}px)`
    }}>
      Parallax element
    </div>
  );
}
```

### 7. Batch DOM Updates

```tsx
import { signal, batch } from '@philjs/core';

function BatchedUpdates() {
  const x = signal(0);
  const y = signal(0);
  const scale = signal(1);

  const updateAll = () => {
    // Batch updates to trigger single re-render
    batch(() => {
      x.set(100);
      y.set(50);
      scale.set(1.5);
    });
  };

  return (
    <div style={{
      transform: `translate(${x()}px, ${y()}px) scale(${scale()})`
    }}>
      Batched element
    </div>
  );
}
```

## Best Practices

### Choose the Right Technique

```tsx
// Simple state changes → CSS transitions
const isHovered = signal(false);
<div style={{
  opacity: isHovered() ? 1 : 0.7,
  transition: 'opacity 200ms'
}} />

// Complex multi-step → CSS keyframes
<div className="bounce" />

// Precise control → JavaScript RAF
effect(() => {
  const animate = () => {
    // Custom animation logic
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
});

// Physics-based → Spring animations
const animated = createAnimatedValue(0);
animated.set(100, { easing: { stiffness: 0.15 } });

// Page transitions → View Transitions API
document.startViewTransition(() => {
  router.push('/page');
});

// Complex sequences → Animation library
gsap.timeline()
  .to('.el1', { x: 100 })
  .to('.el2', { y: 50 });
```

### Keep Animations Short

```tsx
// ✅ Good - snappy and responsive
transition: 'transform 200ms ease-out'

// ⚠️ Use sparingly - feels slow
transition: 'transform 800ms ease-out'

// ❌ Avoid - too slow for most UIs
transition: 'transform 2000ms ease-out'
```

### Use Appropriate Easing

```css
/* Entering animations - start slow, end fast */
.enter {
  animation: slideIn 300ms ease-out;
}

/* Exiting animations - start fast, end slow */
.exit {
  animation: slideOut 200ms ease-in;
}

/* Interactive elements - smooth both ways */
.interactive {
  transition: transform 250ms ease-in-out;
}

/* Natural motion - cubic bezier */
.natural {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Complete Example: Animated Modal

```tsx
import { signal } from '@philjs/core';

function AnimatedModal() {
  const isOpen = signal(false);
  const isAnimating = signal(false);

  const openModal = () => {
    isOpen.set(true);
    requestAnimationFrame(() => {
      isAnimating.set(true);
    });
  };

  const closeModal = () => {
    isAnimating.set(false);
    setTimeout(() => {
      isOpen.set(false);
    }, 300); // Match animation duration
  };

  if (!isOpen()) return (
    <button onClick={openModal}>Open Modal</button>
  );

  return (
    <>
      <button onClick={openModal}>Open Modal</button>

      {/* Backdrop */}
      <div
        onClick={closeModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          opacity: isAnimating() ? 1 : 0,
          transition: 'opacity 300ms ease-out',
          cursor: 'pointer'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: isAnimating()
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.9)',
          opacity: isAnimating() ? 1 : 0,
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '90%'
        }}
      >
        <h2>Animated Modal</h2>
        <p>This modal animates in smoothly!</p>
        <button onClick={closeModal}>Close</button>
      </div>
    </>
  );
}
```

## Next Steps

- [View Transitions](/docs/routing/view-transitions.md) - Deep dive into page transitions
- [Performance](/docs/performance/overview.md) - Optimize your animations
- [Styling](/docs/styling/overview.md) - CSS-in-JS and styling options

---

**Performance Tips:**
- Use `transform` and `opacity` for 60fps animations
- Avoid animating `width`, `height`, `margin`, `padding`
- Use `will-change` only during active animations
- Respect `prefers-reduced-motion` for accessibility
- Batch multiple signal updates with `batch()`

**Browser Support:**
- CSS transitions/animations: All modern browsers
- View Transitions API: Chrome 111+, Edge 111+, Safari 18+ (limited)
- Spring animations: All browsers (JavaScript-based)

**Tips:**
- Choose CSS for simple transitions, JavaScript for complex animations
- Test animations at 60fps and on lower-end devices
- Provide fallbacks for View Transitions API
- Keep animations under 400ms for best UX
