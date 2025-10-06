# Styling Animations

Create smooth, performant animations with CSS transitions, keyframes, and JavaScript-based animations.

## CSS Transitions

### Basic Transitions

```tsx
import { signal } from 'philjs-core';

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

## CSS Animations

### Keyframe Animations

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
```

```tsx
import './styles.css';

export default function SlideInComponent() {
  return (
    <div class="slide-in">
      Content slides in!
    </div>
  );
}
```

## JavaScript Animations

### RAF Animation

```tsx
import { signal, effect } from 'philjs-core';

export default function AnimatedCounter() {
  const count = signal(0);
  const displayCount = signal(0);

  effect(() => {
    const target = count();
    const start = displayCount();
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      displayCount.set(start + (target - start) * progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  });

  return (
    <div>
      <h1>{Math.round(displayCount())}</h1>
      <button onClick={() => count.set(count() + 100)}>
        +100
      </button>
    </div>
  );
}
```

## Best Practices

### ✅ Do: Use Transform and Opacity

```tsx
// ✅ Good - GPU accelerated
<div style={{ transform: 'translateX(100px)', opacity: 0.5 }} />

// ❌ Bad - causes layout recalc
<div style={{ left: '100px' }} />
```

### ✅ Do: Use will-change Sparingly

```tsx
<div
  style={{
    willChange: isAnimating() ? 'transform' : 'auto',
    transform: `scale(${scale()})`
  }}
/>
```

## Next Steps

- [Animations](/docs/learn/animations.md) - Animation patterns
- [Performance](/docs/performance/overview.md) - Optimize animations
- [View Transitions](/docs/routing/view-transitions.md) - Page transitions

---

💡 **Tip**: Use transform and opacity for 60fps animations.

⚠️ **Warning**: Avoid animating layout properties (width, height, margin).

ℹ️ **Note**: CSS animations are more performant than JavaScript for simple transitions.
