# CSS-in-JS

Create dynamic, type-safe styles with JavaScript in PhilJS applications.

## What You'll Learn

- CSS-in-JS basics
- Dynamic styling with signals
- Style objects
- Styled components pattern
- Theme integration
- Performance considerations
- Best practices

## CSS-in-JS Basics

### Inline Styles with Objects

```typescript
import { signal } from 'philjs-core';

export function Button({ variant = 'primary' }: {
  variant?: 'primary' | 'secondary';
}) {
  const styles = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: variant === 'primary' ? '#007bff' : '#6c757d',
    color: 'white'
  };

  return <button style={styles}>Click me</button>;
}
```

### Dynamic Styles with Signals

```typescript
import { signal } from 'philjs-core';

export function Box() {
  const hovered = signal(false);

  const styles = {
    width: '200px',
    height: '200px',
    backgroundColor: hovered() ? '#0056b3' : '#007bff',
    transform: hovered() ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  return (
    <div
      style={styles}
      onMouseEnter={() => hovered.set(true)}
      onMouseLeave={() => hovered.set(false)}
    >
      Hover me
    </div>
  );
}
```

## Style Helper Functions

### Style Factory

```typescript
type StyleProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
};

function createButtonStyles(props: StyleProps) {
  const variantStyles = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' },
    danger: { backgroundColor: '#dc3545', color: 'white' }
  };

  const sizeStyles = {
    small: { padding: '4px 8px', fontSize: '12px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' }
  };

  return {
    ...variantStyles[props.variant || 'primary'],
    ...sizeStyles[props.size || 'medium'],
    width: props.fullWidth ? '100%' : 'auto',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
}

export function Button(props: StyleProps & { children: any }) {
  return (
    <button style={createButtonStyles(props)}>
      {props.children}
    </button>
  );
}
```

### Responsive Styles

```typescript
import { signal, effect } from 'philjs-core';

function useMediaQuery(query: string) {
  const matches = signal(false);

  effect(() => {
    const mediaQuery = window.matchMedia(query);
    matches.set(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => matches.set(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  });

  return matches;
}

export function ResponsiveBox() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const styles = {
    padding: isDesktop() ? '32px' : isTablet() ? '24px' : '16px',
    fontSize: isDesktop() ? '18px' : '16px',
    backgroundColor: isDesktop() ? '#007bff' : isTablet() ? '#6c757d' : '#28a745'
  };

  return <div style={styles}>Responsive content</div>;
}
```

## Styled Components Pattern

### Basic Styled Component

```typescript
import { signal } from 'philjs-core';

function styled<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  styles: JSX.IntrinsicElements[T]['style'] | ((props: any) => JSX.IntrinsicElements[T]['style'])
) {
  return (props: any) => {
    const Tag = tag;
    const computedStyles = typeof styles === 'function' ? styles(props) : styles;

    return <Tag {...props} style={{ ...computedStyles, ...props.style }} />;
  };
}

// Create styled components
const StyledButton = styled('button', (props: { variant?: 'primary' | 'secondary' }) => ({
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  backgroundColor: props.variant === 'secondary' ? '#6c757d' : '#007bff',
  color: 'white'
}));

// Usage
export function MyComponent() {
  return (
    <div>
      <StyledButton variant="primary">Primary</StyledButton>
      <StyledButton variant="secondary">Secondary</StyledButton>
    </div>
  );
}
```

### Advanced Styled Components

```typescript
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
};

const Button = styled('button', (props: ButtonProps) => {
  const baseStyles = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.6 : 1,
    transition: 'all 0.2s',
    fontWeight: 500
  };

  const variantStyles = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' },
    danger: { backgroundColor: '#dc3545', color: 'white' }
  }[props.variant || 'primary'];

  const sizeStyles = {
    small: { padding: '4px 8px', fontSize: '12px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' }
  }[props.size || 'medium'];

  return { ...baseStyles, ...variantStyles, ...sizeStyles };
});

const Card = styled('div', {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
});

const CardTitle = styled('h2', {
  fontSize: '20px',
  fontWeight: 600,
  marginBottom: '8px'
});

export function StyledCard() {
  return (
    <Card>
      <CardTitle>Card Title</CardTitle>
      <p>Card content goes here</p>
      <Button variant="primary" size="medium">
        Action
      </Button>
    </Card>
  );
}
```

## Theme Integration

### Theme Provider

```typescript
import { createContext, signal } from 'philjs-core';

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
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#333333'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  },
  fontSize: {
    small: '12px',
    medium: '14px',
    large: '18px'
  }
};

const darkTheme: Theme = {
  colors: {
    primary: '#0d6efd',
    secondary: '#6c757d',
    background: '#1a1a1a',
    text: '#ffffff'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  },
  fontSize: {
    small: '12px',
    medium: '14px',
    large: '18px'
  }
};

const ThemeContext = createContext<{
  theme: () => Theme;
  toggleTheme: () => void;
}>();

export function ThemeProvider({ children }: { children: any }) {
  const isDark = signal(false);

  const theme = () => isDark() ? darkTheme : lightTheme;

  const toggleTheme = () => isDark.set(!isDark());

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        style={{
          backgroundColor: theme().colors.background,
          color: theme().colors.text,
          minHeight: '100vh'
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return ThemeContext.use();
}
```

### Using Theme

```typescript
import { useTheme } from './ThemeProvider';

export function ThemedButton({ children }: { children: any }) {
  const { theme } = useTheme();

  const styles = {
    padding: theme().spacing.medium,
    fontSize: theme().fontSize.medium,
    backgroundColor: theme().colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  return <button style={styles}>{children}</button>;
}

export function ThemedCard({ children }: { children: any }) {
  const { theme, toggleTheme } = useTheme();

  const styles = {
    backgroundColor: theme().colors.background,
    color: theme().colors.text,
    padding: theme().spacing.large,
    borderRadius: '8px',
    border: `1px solid ${theme().colors.secondary}`
  };

  return (
    <div style={styles}>
      {children}
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Animation and Transitions

### Keyframe Animations

```typescript
import { signal, effect } from 'philjs-core';

export function AnimatedBox() {
  const isAnimating = signal(false);
  const rotation = signal(0);

  effect(() => {
    if (!isAnimating()) return;

    const interval = setInterval(() => {
      rotation.set((rotation() + 5) % 360);
    }, 16);

    return () => clearInterval(interval);
  });

  const styles = {
    width: '100px',
    height: '100px',
    backgroundColor: '#007bff',
    transform: `rotate(${rotation()}deg)`,
    transition: 'transform 0.016s linear'
  };

  return (
    <div>
      <div style={styles} />
      <button onClick={() => isAnimating.set(!isAnimating())}>
        {isAnimating() ? 'Stop' : 'Start'} Animation
      </button>
    </div>
  );
}
```

### Spring Animations

```typescript
import { signal, effect } from 'philjs-core';

function useSpring(target: () => number, config = { stiffness: 0.1, damping: 0.8 }) {
  const value = signal(target());
  const velocity = signal(0);

  effect(() => {
    const targetValue = target();
    let animationId: number;

    const animate = () => {
      const spring = (targetValue - value()) * config.stiffness;
      const damping = velocity() * config.damping;

      velocity.set(velocity() + spring - damping);
      value.set(value() + velocity());

      if (Math.abs(velocity()) > 0.01 || Math.abs(targetValue - value()) > 0.01) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  });

  return value;
}

export function SpringBox() {
  const targetX = signal(0);
  const x = useSpring(targetX);

  const styles = {
    width: '50px',
    height: '50px',
    backgroundColor: '#007bff',
    transform: `translateX(${x()}px)`,
    cursor: 'pointer'
  };

  return (
    <div>
      <div
        style={styles}
        onClick={() => targetX.set(targetX() === 0 ? 300 : 0)}
      />
    </div>
  );
}
```

## Performance Considerations

### Memoize Style Objects

```typescript
import { signal, memo } from 'philjs-core';

export function OptimizedComponent() {
  const size = signal(100);
  const color = signal('#007bff');

  // Memoize styles to avoid recreating on every render
  const styles = memo(() => ({
    width: `${size()}px`,
    height: `${size()}px`,
    backgroundColor: color(),
    transition: 'all 0.3s'
  }));

  return <div style={styles()}>Optimized</div>;
}
```

### Avoid Inline Style Objects

```typescript
// ❌ Creates new object on every render
export function BadComponent() {
  return (
    <div style={{ padding: '16px', backgroundColor: 'blue' }}>
      Content
    </div>
  );
}

// ✅ Reuse style object
const divStyles = { padding: '16px', backgroundColor: 'blue' };

export function GoodComponent() {
  return <div style={divStyles}>Content</div>;
}
```

## Best Practices

### Type Your Styles

```typescript
// ✅ Type-safe style objects
type ButtonStyles = {
  padding: string;
  backgroundColor: string;
  color: string;
  border: string;
  borderRadius: string;
};

const buttonStyles: ButtonStyles = {
  padding: '8px 16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px'
};

// ❌ Untyped styles (prone to errors)
const styles = {
  paddng: '8px', // Typo not caught
  color: 'blu' // Invalid value not caught
};
```

### Extract Reusable Styles

```typescript
// ✅ Shared style constants
const colors = {
  primary: '#007bff',
  secondary: '#6c757d',
  danger: '#dc3545'
};

const spacing = {
  small: '8px',
  medium: '16px',
  large: '24px'
};

// ❌ Duplicate values everywhere
const button1 = { padding: '8px 16px' };
const button2 = { padding: '8px 16px' };
```

### Use CSS for Static Styles

```typescript
// ✅ Use CSS for static, unchanging styles
// button.css
/*
.button {
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
*/

// ❌ Inline styles for static values
<button style={{ border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
  Click
</button>
```

### Combine with CSS Classes

```typescript
// ✅ Base styles in CSS, dynamic in JS
// button.css
/*
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
}
*/

import { signal } from 'philjs-core';

export function Button() {
  const color = signal('#007bff');

  return (
    <button
      className="button"
      style={{ backgroundColor: color() }}
    >
      Click me
    </button>
  );
}
```

## Summary

You've learned:

✅ CSS-in-JS basics with style objects
✅ Dynamic styling with signals
✅ Styled components pattern
✅ Theme integration and context
✅ Animations with JavaScript
✅ Performance optimizations
✅ Best practices for CSS-in-JS

CSS-in-JS provides powerful dynamic styling capabilities!

---

**Next:** [Tailwind CSS →](./tailwind.md) Utility-first CSS with PhilJS
