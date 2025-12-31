# Styling Overview

Learn different approaches to styling PhilJS applications, from plain CSS to modern CSS-in-JS solutions.

## What You'll Learn

- Styling approaches
- Plain CSS
- CSS Modules
- CSS-in-JS
- Tailwind CSS
- Sass/SCSS
- Choosing the right approach
- Best practices

## Styling Approaches

PhilJS is unopinionated about styling. Use any approach that fits your needs:

### Available Options

1. **Plain CSS** - Traditional CSS files
2. **CSS Modules** - Scoped CSS with build-time processing
3. **CSS-in-JS** - Dynamic styles with JavaScript
4. **Tailwind CSS** - Utility-first CSS framework
5. **Sass/SCSS** - CSS preprocessor
6. **Styled Components** - Component-scoped styles

## Plain CSS

### Basic Stylesheet

```typescript
// Button.tsx
import './Button.css';

export function Button({ children, variant = 'primary' }: {
  children: any;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <button className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}
```

```css
/* Button.css */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}
```

### Global Styles

```typescript
// src/styles/global.css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --text-color: #333;
  --background-color: #fff;
  --border-radius: 4px;
  --spacing-unit: 8px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.5;
}

// Import in main entry file
// src/index.tsx
import './styles/global.css';
```

## CSS Modules

### Scoped Styles

```typescript
// Button.module.css
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary {
  background-color: #007bff;
  color: white;
}

.secondary {
  background-color: #6c757d;
  color: white;
}

// Button.tsx
import styles from './Button.module.css';

export function Button({ children, variant = 'primary' }: {
  children: any;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### Composition

```css
/* Card.module.css */
.base {
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card {
  composes: base;
  background-color: white;
}

.cardDark {
  composes: base;
  background-color: #333;
  color: white;
}
```

## Inline Styles

### Dynamic Styles with Signals

```typescript
import { signal } from '@philjs/core';

function Box() {
  const color = signal('#007bff');
  const size = signal(100);

  return (
    <div
      style={{
        backgroundColor: color(),
        width: `${size()}px`,
        height: `${size()}px`,
        transition: 'all 0.3s'
      }}
    >
      <button onClick={() => color.set('#6c757d')}>
        Change Color
      </button>
      <button onClick={() => size.set(size() + 20)}>
        Increase Size
      </button>
    </div>
  );
}
```

### Style Object Pattern

```typescript
const buttonStyles = {
  base: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  primary: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  secondary: {
    backgroundColor: '#6c757d',
    color: 'white'
  }
};

function Button({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  return (
    <button style={{ ...buttonStyles.base, ...buttonStyles[variant] }}>
      Click me
    </button>
  );
}
```

## Class Name Helpers

### Conditional Classes

```typescript
import { signal } from '@philjs/core';

function classNames(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function Alert({ type = 'info' }: { type?: 'info' | 'warning' | 'error' }) {
  const isVisible = signal(true);

  return (
    <div
      className={classNames(
        'alert',
        `alert-${type}`,
        isVisible() && 'alert-visible'
      )}
    >
      Alert message
    </div>
  );
}
```

### Class Builder Utility

```typescript
type ClassValue = string | undefined | null | false | ClassValue[];

function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const result = cn(...input);
      if (result) classes.push(result);
    }
  }

  return classes.join(' ');
}

// Usage
function Button({ variant, disabled }: {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        disabled && 'btn-disabled'
      )}
    >
      Click me
    </button>
  );
}
```

## CSS Variables with Signals

### Dynamic CSS Variables

```typescript
import { signal, effect } from '@philjs/core';

function ThemedApp() {
  const primaryColor = signal('#007bff');
  const fontSize = signal(16);

  // Update CSS variables when signals change
  effect(() => {
    document.documentElement.style.setProperty(
      '--primary-color',
      primaryColor()
    );
    document.documentElement.style.setProperty(
      '--base-font-size',
      `${fontSize()}px`
    );
  });

  return (
    <div className="app">
      <h1 style={{ color: 'var(--primary-color)' }}>
        Dynamic Theming
      </h1>

      <button onClick={() => primaryColor.set('#dc3545')}>
        Change Primary Color
      </button>

      <button onClick={() => fontSize.set(fontSize() + 2)}>
        Increase Font Size
      </button>
    </div>
  );
}
```

## Style Composition

### Combining Approaches

```typescript
// Using CSS Modules + inline styles
import styles from './Card.module.css';
import { signal } from '@philjs/core';

function Card({ children }: { children: any }) {
  const elevation = signal(2);

  return (
    <div
      className={styles.card}
      style={{
        boxShadow: `0 ${elevation()}px ${elevation() * 2}px rgba(0, 0, 0, 0.1)`
      }}
      onMouseEnter={() => elevation.set(8)}
      onMouseLeave={() => elevation.set(2)}
    >
      {children}
    </div>
  );
}
```

## Choosing an Approach

### Use Plain CSS When:
- Simple, static styles
- No build process needed
- Traditional web development workflow
- Learning or prototyping

### Use CSS Modules When:
- Component-scoped styles
- Avoiding naming conflicts
- Build process available
- Team prefers CSS

### Use CSS-in-JS When:
- Dynamic, theme-based styles
- Full TypeScript integration
- Component logic tightly coupled with styles
- Runtime style generation needed

### Use Tailwind When:
- Rapid prototyping
- Utility-first approach preferred
- Consistent design system
- Minimal custom CSS

### Use Sass/SCSS When:
- Complex stylesheets
- Nested selectors needed
- Variables and mixins required
- Team familiar with Sass

## Best Practices

### Scope Your Styles

```typescript
// ✅ Use CSS Modules or unique class names
import styles from './Button.module.css';
<button className={styles.button}>Click</button>

// ❌ Generic class names (collision risk)
<button className="button">Click</button>
```

### Use CSS Variables for Theming

```typescript
// ✅ CSS variables for dynamic values
:root {
  --primary-color: #007bff;
}

.button {
  background: var(--primary-color);
}

// ❌ Hardcoded colors everywhere
.button {
  background: #007bff;
}
```

### Avoid Inline Styles for Static Styles

```typescript
// ✅ Use CSS for static styles
<div className="card">...</div>

// ❌ Inline styles for static values
<div style={{ padding: '16px', borderRadius: '8px' }}>...</div>
```

### Keep Styles Close to Components

```typescript
// ✅ Co-locate styles with components
// components/
//   Button/
//     Button.tsx
//     Button.module.css

// ❌ Separate styles directory
// styles/
//   button.css
// components/
//   Button.tsx
```

### Use Semantic Class Names

```typescript
// ✅ Descriptive, semantic names
.card-header { }
.card-body { }
.card-footer { }

// ❌ Generic, non-descriptive names
.ch { }
.cb { }
.cf { }
```

## Performance Considerations

### Critical CSS

```html
<!-- Inline critical CSS for faster first paint -->
<style>
  .above-fold {
    /* Critical styles for above-the-fold content */
  }
</style>

<!-- Defer non-critical CSS -->
<link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'">
```

### CSS Splitting

```typescript
// Load CSS only when component is used
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// HeavyComponent.tsx
import './heavy-styles.css'; // Loaded only when component loads
```

## Summary

You've learned:

✅ Different styling approaches in PhilJS
✅ Plain CSS and CSS Modules
✅ Inline styles with signals
✅ Class name utilities
✅ CSS variables with dynamic theming
✅ Choosing the right approach
✅ Best practices for styling
✅ Performance considerations

Choose the styling approach that best fits your project needs!

---

**Next:** [CSS Modules →](./css-modules.md) Deep dive into CSS Modules with PhilJS
