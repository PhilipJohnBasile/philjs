# Styling and CSS

Learn how to style your PhilJS components using various approaches - from inline styles to CSS modules to popular CSS-in-JS solutions.

## What You'll Learn

- Inline styles
- External CSS
- CSS modules
- CSS-in-JS libraries
- Dynamic styling with signals
- Best practices

## Inline Styles

Use the `style` prop with a JavaScript object:

```typescript
function Button() {
  return (
    <button
      style={{
        padding: '0.5rem 1rem',
        background: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Click me
    </button>
  );
}
```

### CamelCase Properties

CSS properties use camelCase in JavaScript:

```typescript
const styles = {
  backgroundColor: '#fff', // background-color
  fontSize: '16px', // font-size
  fontWeight: 'bold', // font-weight
  borderRadius: '4px', // border-radius
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // box-shadow
};

<div style={styles}>Content</div>
```

### Numeric Values

Numbers are automatically converted to `px`:

```typescript
<div
  style={{
    width: 300, // becomes "300px"
    height: 200, // becomes "200px"
    margin: 10, // becomes "10px"
    padding: 20 // becomes "20px"
  }}
/>

// For other units, use strings
<div
  style={{
    width: '50%',
    height: '100vh',
    margin: '1rem',
    fontSize: '1.5em'
  }}
/>
```

### Dynamic Inline Styles

```typescript
function Button({ variant }: { variant: 'primary' | 'secondary' }) {
  const colors = {
    primary: { bg: '#667eea', text: 'white' },
    secondary: { bg: '#e0e0e0', text: '#333' }
  };

  return (
    <button
      style={{
        background: colors[variant].bg,
        color: colors[variant].text,
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '4px'
      }}
    >
      Click me
    </button>
  );
}
```

### With Signals

```typescript
function ThemedButton() {
  const theme = signal<'light' | 'dark'>('light');

  return (
    <button
      style={{
        background: theme() === 'dark' ? '#333' : '#fff',
        color: theme() === 'dark' ? '#fff' : '#333',
        border: `1px solid ${theme() === 'dark' ? '#555' : '#ddd'}`,
        padding: '0.5rem 1rem'
      }}
      onClick={() => theme.set(t => t === 'light' ? 'dark' : 'light')}
    >
      Toggle Theme
    </button>
  );
}
```

## External CSS

### Global CSS

```css
/* styles.css */
.button {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background: #5568d3;
}

.button.secondary {
  background: #e0e0e0;
  color: #333;
}
```

```typescript
// Import CSS file
import './styles.css';

function Button({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  return (
    <button className={`button ${variant === 'secondary' ? 'secondary' : ''}`}>
      Click me
    </button>
  );
}
```

### Conditional Classes

```typescript
function Card({ highlighted }: { highlighted: boolean }) {
  return (
    <div className={`card ${highlighted ? 'highlighted' : ''}`}>
      Content
    </div>
  );
}

// With multiple conditions
function Button({ variant, size, disabled }: {
  variant: 'primary' | 'secondary';
  size: 'small' | 'large';
  disabled?: boolean;
}) {
  const className = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    disabled && 'button-disabled'
  ].filter(Boolean).join(' ');

  return <button className={className}>Click</button>;
}
```

### Class Helper Function

```typescript
function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function Button({ variant, size, disabled }: ButtonProps) {
  return (
    <button
      className={classNames(
        'button',
        `button-${variant}`,
        `button-${size}`,
        disabled && 'button-disabled'
      )}
    >
      Click
    </button>
  );
}
```

## CSS Modules

CSS Modules scope styles to components automatically:

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
}

.primary {
  background: #667eea;
}

.secondary {
  background: #e0e0e0;
  color: #333;
}
```

```typescript
// Button.tsx
import styles from './Button.module.css';

function Button({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      Click me
    </button>
  );
}

// Scoped class names prevent collisions!
// .button becomes something like: .Button_button__abc123
```

### Composing Classes

```typescript
import styles from './Card.module.css';

function Card({ highlighted, large }: {
  highlighted?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={[
        styles.card,
        highlighted && styles.highlighted,
        large && styles.large
      ].filter(Boolean).join(' ')}
    >
      Content
    </div>
  );
}
```

## Styled Components Pattern

Create reusable styled components:

```typescript
// Styled component factory
function styled(tag: string, styles: Record<string, any>) {
  return ({ children, ...props }: any) => {
    const Component = tag as any;
    return <Component style={styles} {...props}>{children}</Component>;
  };
}

// Create styled components
const Button = styled('button', {
  padding: '0.5rem 1rem',
  background: '#667eea',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
});

const Card = styled('div', {
  padding: '1rem',
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
});

// Usage:
<Card>
  <h2>Title</h2>
  <p>Content</p>
  <Button>Action</Button>
</Card>
```

### With Variants

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'large';
  children: any;
}

const buttonStyles = {
  base: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  variants: {
    primary: {
      background: '#667eea',
      color: 'white'
    },
    secondary: {
      background: '#e0e0e0',
      color: '#333'
    }
  },
  sizes: {
    small: {
      fontSize: '0.875rem',
      padding: '0.25rem 0.5rem'
    },
    large: {
      fontSize: '1.125rem',
      padding: '0.75rem 1.5rem'
    }
  }
};

function Button({
  variant = 'primary',
  size = 'medium',
  children,
  ...props
}: ButtonProps) {
  const style = {
    ...buttonStyles.base,
    ...buttonStyles.variants[variant],
    ...(size !== 'medium' && buttonStyles.sizes[size])
  };

  return <button style={style} {...props}>{children}</button>;
}
```

## Theme System

Create a theming system with context:

```typescript
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
}

const lightTheme: Theme = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#ffffff',
    text: '#000000'
  },
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '2rem'
  },
  borderRadius: '4px'
};

const darkTheme: Theme = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#1a1a1a',
    text: '#ffffff'
  },
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '2rem'
  },
  borderRadius: '4px'
};

const ThemeContext = createContext<Signal<Theme>>();

function ThemeProvider({ children }: { children: any }) {
  const theme = signal(lightTheme);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}

// Usage:
function Card({ children }: { children: any }) {
  const theme = useTheme();

  return (
    <div
      style={{
        background: theme().colors.background,
        color: theme().colors.text,
        padding: theme().spacing.medium,
        borderRadius: theme().borderRadius
      }}
    >
      {children}
    </div>
  );
}
```

## Responsive Styles

### Media Queries in CSS

```css
/* styles.css */
.container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}
```

### JavaScript Breakpoints

```typescript
function useBreakpoint() {
  const width = signal(window.innerWidth);

  effect(() => {
    const handleResize = () => width.set(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  return {
    isMobile: memo(() => width() < 768),
    isTablet: memo(() => width() >= 768 && width() < 1024),
    isDesktop: memo(() => width() >= 1024)
  };
}

function ResponsiveLayout() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  return (
    <div>
      {isMobile() && <MobileLayout />}
      {isTablet() && <TabletLayout />}
      {isDesktop() && <DesktopLayout />}
    </div>
  );
}
```

## CSS Variables

Use CSS custom properties:

```css
:root {
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
}

.button {
  background: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
}
```

```typescript
// Update CSS variables with JavaScript
function ThemeToggle() {
  const isDark = signal(false);

  effect(() => {
    if (isDark()) {
      document.documentElement.style.setProperty('--color-primary', '#333');
      document.documentElement.style.setProperty('--color-background', '#1a1a1a');
    } else {
      document.documentElement.style.setProperty('--color-primary', '#667eea');
      document.documentElement.style.setProperty('--color-background', '#ffffff');
    }
  });

  return (
    <button onClick={() => isDark.set(!isDark())}>
      Toggle Theme
    </button>
  );
}
```

## Animation

### CSS Transitions

```css
.button {
  background: #667eea;
  transition: all 0.3s ease;
}

.button:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
```

```typescript
function AnimatedButton() {
  return (
    <button
      style={{
        background: '#667eea',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '4px',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      Hover me
    </button>
  );
}
```

### CSS Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.5s ease;
}
```

### Signal-based Animations

```typescript
function FadeIn({ children }: { children: any }) {
  const opacity = signal(0);

  effect(() => {
    const interval = setInterval(() => {
      opacity.set(o => Math.min(o + 0.05, 1));
    }, 16);

    return () => clearInterval(interval);
  });

  return (
    <div style={{ opacity: opacity(), transition: 'opacity 0.3s' }}>
      {children}
    </div>
  );
}
```

## Utility CSS (Tailwind-like)

Create utility classes:

```css
/* utilities.css */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.font-bold { font-weight: bold; }
```

```typescript
function Card() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-bold">Title</h2>
      <p className="text-sm">Description</p>
    </div>
  );
}
```

## Best Practices

### Prefer CSS for Static Styles

```typescript
// ❌ Inline styles for everything
<button style={{ padding: '0.5rem 1rem', background: '#667eea', color: 'white' }}>
  Click
</button>

// ✅ CSS for static styles
<button className="button">Click</button>
```

### Use Inline Styles for Dynamic Values

```typescript
// ✅ Inline for dynamic values
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${progress}%` }} // Dynamic!
      />
    </div>
  );
}
```

### Co-locate Styles with Components

```
components/
  Button/
    Button.tsx
    Button.module.css
    index.ts
```

### Avoid Inline Style Objects in Render

```typescript
// ❌ Creates new object every render
function Button() {
  return (
    <button style={{ padding: '0.5rem', background: '#667eea' }}>
      Click
    </button>
  );
}

// ✅ Define outside component
const buttonStyle = {
  padding: '0.5rem',
  background: '#667eea'
};

function Button() {
  return <button style={buttonStyle}>Click</button>;
}
```

### Use CSS Variables for Themes

```css
:root {
  --color-primary: #667eea;
  --color-text: #000;
}

[data-theme="dark"] {
  --color-primary: #8b9dff;
  --color-text: #fff;
}
```

## Summary

You've learned:

✅ Inline styles with JavaScript objects
✅ External CSS and class names
✅ CSS Modules for scoped styles
✅ Styled component patterns
✅ Theme systems with context
✅ Responsive design approaches
✅ CSS variables for dynamic theming
✅ Animations and transitions
✅ Best practices for styling

Choose the approach that fits your project!

---

**Next:** [Refs and DOM Access →](./refs.md) Direct DOM manipulation when needed
