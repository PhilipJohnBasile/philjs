# Inline Styles

Inline styles in PhilJS provide dynamic styling with full TypeScript support. Perfect for runtime calculations and responsive designs.

## Basic Inline Styles

### Style Object

```tsx
export default function StyledButton() {
  return (
    <button
      style={{
        backgroundColor: '#3498db',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      Click Me
    </button>
  );
}
```

### Dynamic Styles

```tsx
import { signal } from '@philjs/core';

export default function DynamicBox() {
  const isActive = signal(false);

  return (
    <div
      style={{
        backgroundColor: isActive() ? '#3498db' : '#ecf0f1',
        color: isActive() ? 'white' : 'black',
        padding: '20px',
        transition: 'all 0.3s ease'
      }}
      onClick={() => isActive.set(!isActive())}
    >
      Click to toggle
    </div>
  );
}
```

## Responsive Inline Styles

### Window Size Based

```tsx
import { signal, effect } from '@philjs/core';

export default function ResponsiveComponent() {
  const windowWidth = signal(window.innerWidth);

  effect(() => {
    const handleResize = () => {
      windowWidth.set(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  return (
    <div
      style={{
        fontSize: windowWidth() < 768 ? '14px' : '16px',
        padding: windowWidth() < 768 ? '10px' : '20px'
      }}
    >
      Responsive content
    </div>
  );
}
```

## CSS Variables

### Using CSS Variables

```tsx
export default function ThemedComponent() {
  return (
    <div
      style={{
        '--primary-color': '#3498db',
        '--spacing': '20px',
        color: 'var(--primary-color)',
        padding: 'var(--spacing)'
      } as any}
    >
      Themed content
    </div>
  );
}
```

## Computed Styles

### Calculated Values

```tsx
import { signal, memo } from '@philjs/core';

export default function ProgressBar() {
  const progress = signal(0);

  const barStyle = memo(() => ({
    width: `${progress()}%`,
    backgroundColor: progress() > 75 ? 'green' : 'blue',
    height: '20px',
    transition: 'all 0.3s ease'
  }));

  return (
    <div style={{ width: '100%', backgroundColor: '#f0f0f0' }}>
      <div style={barStyle()} />
    </div>
  );
}
```

## Best Practices

### ✅ Do: Use for Dynamic Styles

```tsx
// ✅ Good - dynamic value
<div style={{ transform: `rotate(${angle()}deg)` }} />

// ❌ Bad - static styles
<div style={{ color: 'blue' }} /> // Use CSS class instead
```

### ✅ Do: Memoize Complex Styles

```tsx
// ✅ Good - memoized
const style = memo(() => ({
  transform: `translate(${x()}px, ${y()}px) scale(${scale()})`,
  filter: `blur(${blur()}px)`
}));

<div style={style()} />
```

## Next Steps

- [CSS Modules](/docs/styling/css-modules.md) - Scoped styles
- [Tailwind](/docs/styling/tailwind.md) - Utility-first CSS
- [Animations](/docs/styling/animations.md) - Animated styles

---

💡 **Tip**: Use inline styles for dynamic values, CSS classes for static styles.

⚠️ **Warning**: Avoid inline styles for complex styling—use CSS modules instead.

ℹ️ **Note**: PhilJS inline styles support all valid CSS properties with TypeScript autocomplete.
