# CSS Modules

Use CSS Modules for scoped, maintainable styles in PhilJS applications.

## What You'll Learn

- CSS Modules basics
- Setup and configuration
- Class composition
- Dynamic classes
- TypeScript integration
- Global styles
- Best practices

## CSS Modules Basics

### What are CSS Modules?

CSS Modules automatically scope CSS class names to avoid conflicts:

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
}

.primary {
  background-color: #007bff;
  color: white;
}
```

```typescript
// Button.tsx
import styles from './Button.module.css';

export function Button() {
  return (
    <button className={styles.button}>
      Click me
    </button>
  );
}

// Renders as: <button class="Button_button__x7k9p">
```

### File Naming

CSS Modules use the `.module.css` extension:

```
components/
  Button/
    Button.tsx
    Button.module.css   ✅ CSS Module
    Button.css          ❌ Regular CSS (global)
```

## Setup

### Vite Configuration

CSS Modules work out of the box with Vite:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    modules: {
      // Customize class name generation
      generateScopedName: '[name]__[local]___[hash:base64:5]',

      // Enable camelCase transformation
      localsConvention: 'camelCaseOnly'
    }
  }
});
```

### TypeScript Support

Generate type definitions for CSS Modules:

```bash
npm install -D typescript-plugin-css-modules
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-plugin-css-modules"
      }
    ]
  }
}
```

## Basic Usage

### Simple Component

```css
/* Card.module.css */
.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.content {
  color: #666;
  line-height: 1.6;
}
```

```typescript
// Card.tsx
import styles from './Card.module.css';

export function Card({ title, children }: {
  title: string;
  children: any;
}) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
```

### Multiple Classes

```typescript
import styles from './Button.module.css';

export function Button({ variant, size }: {
  variant: 'primary' | 'secondary';
  size: 'small' | 'large';
}) {
  return (
    <button className={`${styles.button} ${styles[variant]} ${styles[size]}`}>
      Click me
    </button>
  );
}
```

## Class Composition

### Compose from Same File

```css
/* Button.module.css */
.base {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.primary {
  composes: base;
  background-color: #007bff;
  color: white;
}

.secondary {
  composes: base;
  background-color: #6c757d;
  color: white;
}
```

```typescript
// Button.tsx
import styles from './Button.module.css';

export function Button({ variant = 'primary' }: {
  variant?: 'primary' | 'secondary';
}) {
  // Only need to apply one class
  return <button className={styles[variant]}>Click me</button>;
}
```

### Compose from Another File

```css
/* utils.module.css */
.flexCenter {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rounded {
  border-radius: 8px;
}
```

```css
/* Card.module.css */
.card {
  composes: flexCenter rounded from './utils.module.css';
  padding: 16px;
  background: white;
}
```

### Compose from Global

```css
/* Card.module.css */
.card {
  composes: container from global;
  padding: 16px;
}
```

## Dynamic Classes

### Conditional Classes

```typescript
import { signal } from 'philjs-core';
import styles from './Alert.module.css';

export function Alert({ type }: {
  type: 'success' | 'warning' | 'error';
}) {
  const isVisible = signal(true);

  const getClassName = () => {
    const classes = [styles.alert];

    if (type === 'success') classes.push(styles.success);
    if (type === 'warning') classes.push(styles.warning);
    if (type === 'error') classes.push(styles.error);
    if (!isVisible()) classes.push(styles.hidden);

    return classes.join(' ');
  };

  return (
    <div className={getClassName()}>
      Alert message
      <button onClick={() => isVisible.set(false)}>×</button>
    </div>
  );
}
```

### ClassNames Utility

```typescript
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

import styles from './Button.module.css';

export function Button({ variant, disabled, fullWidth }: {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        fullWidth && styles.fullWidth
      )}
      disabled={disabled}
    >
      Click me
    </button>
  );
}
```

## Global Styles

### Local and Global

```css
/* App.module.css */
/* Local scoped class */
.app {
  max-width: 1200px;
  margin: 0 auto;
}

/* Global class */
:global(.no-scroll) {
  overflow: hidden;
}

/* Global selector within local class */
.container :global(.highlight) {
  background: yellow;
}
```

### Global Block

```css
/* theme.module.css */
:global {
  :root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
  }

  * {
    box-sizing: border-box;
  }
}

/* Local scoped styles */
.themed {
  color: var(--primary-color);
}
```

## TypeScript Integration

### Type-Safe Styles

```typescript
// Button.module.css.d.ts (auto-generated)
declare const styles: {
  readonly button: string;
  readonly primary: string;
  readonly secondary: string;
  readonly disabled: string;
};

export default styles;
```

```typescript
// Button.tsx - Full autocomplete and type checking
import styles from './Button.module.css';

// ✅ Type-safe
<button className={styles.button}>Click</button>

// ❌ TypeScript error: Property 'notExists' does not exist
<button className={styles.notExists}>Click</button>
```

### Custom Type Definitions

```typescript
// css-modules.d.ts
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
```

## Naming Conventions

### camelCase (Recommended)

```css
/* Button.module.css */
.primaryButton {
  background: blue;
}

.buttonDisabled {
  opacity: 0.5;
}
```

```typescript
import styles from './Button.module.css';

<button className={styles.primaryButton}>Click</button>
<button className={styles.buttonDisabled}>Disabled</button>
```

### kebab-case (Alternative)

```css
/* Button.module.css */
.primary-button {
  background: blue;
}
```

```typescript
import styles from './Button.module.css';

// Access with bracket notation
<button className={styles['primary-button']}>Click</button>
```

## Advanced Patterns

### Theme Variants

```css
/* Card.module.css */
.card {
  padding: 16px;
  border-radius: 8px;
}

.light {
  composes: card;
  background: white;
  color: #333;
}

.dark {
  composes: card;
  background: #333;
  color: white;
}
```

```typescript
import { signal } from 'philjs-core';
import styles from './Card.module.css';

export function Card({ children }: { children: any }) {
  const theme = signal<'light' | 'dark'>('light');

  return (
    <div className={styles[theme()]}>
      {children}
      <button onClick={() => theme.set(theme() === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

### Responsive Styles

```css
/* Grid.module.css */
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Animation Classes

```css
/* Modal.module.css */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.fadeOut {
  animation: fadeOut 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
```

```typescript
import { signal } from 'philjs-core';
import styles from './Modal.module.css';

export function Modal({ isOpen, onClose }: {
  isOpen: () => boolean;
  onClose: () => void;
}) {
  const animating = signal(false);

  const handleClose = () => {
    animating.set(true);
    setTimeout(() => {
      animating.set(false);
      onClose();
    }, 300);
  };

  if (!isOpen() && !animating()) return null;

  return (
    <div className={`${styles.modal} ${animating() ? styles.fadeOut : styles.fadeIn}`}>
      <div className={styles.content}>
        <button onClick={handleClose}>Close</button>
      </div>
    </div>
  );
}
```

## Best Practices

### Keep Styles Close to Components

```
// ✅ Co-located
components/
  Button/
    Button.tsx
    Button.module.css
    Button.test.tsx

// ❌ Separated
components/
  Button.tsx
styles/
  Button.module.css
```

### Use Composition

```css
/* ✅ Use composes for shared styles */
.button {
  composes: base from './common.module.css';
  padding: 8px 16px;
}

/* ❌ Duplicate styles */
.button {
  font-family: sans-serif;
  cursor: pointer;
  padding: 8px 16px;
}
```

### Semantic Class Names

```css
/* ✅ Descriptive names */
.cardHeader {
  font-size: 20px;
  font-weight: bold;
}

/* ❌ Generic names */
.ch {
  font-size: 20px;
  font-weight: bold;
}
```

### Avoid Deep Nesting

```css
/* ✅ Flat structure */
.card { }
.cardHeader { }
.cardTitle { }
.cardContent { }

/* ❌ Deep nesting */
.card .header .title { }
.card .content { }
```

### Use CSS Variables

```css
/* ✅ CSS variables for theming */
.button {
  background: var(--primary-color);
  color: var(--button-text-color);
}

/* ❌ Hardcoded values */
.button {
  background: #007bff;
  color: white;
}
```

## Common Patterns

### Container Query Pattern

```css
/* Card.module.css */
.card {
  container-type: inline-size;
  padding: 16px;
}

.title {
  font-size: 16px;
}

@container (min-width: 400px) {
  .title {
    font-size: 20px;
  }
}
```

### State Classes

```css
/* Input.module.css */
.input {
  padding: 8px;
  border: 1px solid #ccc;
}

.inputFocused {
  composes: input;
  border-color: #007bff;
  outline: 2px solid #007bff33;
}

.inputError {
  composes: input;
  border-color: #dc3545;
}
```

```typescript
import { signal } from 'philjs-core';
import styles from './Input.module.css';

export function Input({ error }: { error?: string }) {
  const focused = signal(false);

  const getClassName = () => {
    if (error) return styles.inputError;
    if (focused()) return styles.inputFocused;
    return styles.input;
  };

  return (
    <input
      className={getClassName()}
      onFocus={() => focused.set(true)}
      onBlur={() => focused.set(false)}
    />
  );
}
```

## Summary

You've learned:

✅ CSS Modules basics and setup
✅ Class composition patterns
✅ Dynamic class names with signals
✅ TypeScript integration
✅ Global and local styles
✅ Naming conventions
✅ Advanced patterns and animations
✅ Best practices

CSS Modules provide scoped, maintainable styles for PhilJS!

---

**Next:** [CSS-in-JS →](./css-in-js.md) Dynamic styles with JavaScript
