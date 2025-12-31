# Styled Components

Create component-scoped styles with TypeScript integration in PhilJS.

## What You'll Learn

- Styled component pattern
- Type-safe styles
- Dynamic styling
- Theme integration
- Variants and composition
- Best practices

## Basic Styled Components

### Style Helper Function

```typescript
import { signal } from '@philjs/core';
import type { CSSProperties } from '@philjs/core';

type StyleFn<P = {}> = (props: P) => CSSProperties;

function styled<T extends keyof JSX.IntrinsicElements, P = {}>(
  tag: T,
  styles: CSSProperties | StyleFn<P>
) {
  return (props: P & JSX.IntrinsicElements[T]) => {
    const Tag = tag as any;
    const { children, ...rest } = props;

    const computedStyles =
      typeof styles === 'function' ? styles(props as P) : styles;

    return (
      <Tag {...rest} style={{ ...computedStyles, ...rest.style }}>
        {children}
      </Tag>
    );
  };
}

// Usage
const Button = styled('button', {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer'
});

export function App() {
  return <Button>Click me</Button>;
}
```

### Dynamic Styled Components

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

const Button = styled<'button', ButtonProps>('button', (props) => {
  const variants = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' },
    danger: { backgroundColor: '#dc3545', color: 'white' }
  };

  const sizes = {
    small: { padding: '4px 8px', fontSize: '12px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '18px' }
  };

  return {
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...variants[props.variant || 'primary'],
    ...sizes[props.size || 'medium']
  };
});

export function App() {
  return (
    <div>
      <Button variant="primary" size="small">Small Primary</Button>
      <Button variant="secondary" size="medium">Medium Secondary</Button>
      <Button variant="danger" size="large">Large Danger</Button>
    </div>
  );
}
```

## Type-Safe Styles

### Strongly Typed Props

```typescript
interface CardProps {
  elevated?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  rounded?: boolean;
}

const Card = styled<'div', CardProps>('div', (props) => {
  const paddingMap = {
    none: '0',
    small: '8px',
    medium: '16px',
    large: '24px'
  };

  return {
    backgroundColor: 'white',
    borderRadius: props.rounded ? '8px' : '0',
    padding: paddingMap[props.padding || 'medium'],
    boxShadow: props.elevated
      ? '0 4px 6px rgba(0, 0, 0, 0.1)'
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'box-shadow 0.3s'
  };
});

export function App() {
  return (
    <Card elevated padding="large" rounded>
      <h2>Card Title</h2>
      <p>Card content</p>
    </Card>
  );
}
```

### Generic Styled Components

```typescript
function createStyledComponent<
  T extends keyof JSX.IntrinsicElements,
  P extends Record<string, any> = {}
>(tag: T, baseStyles: CSSProperties, variantFn?: (props: P) => CSSProperties) {
  return (props: P & JSX.IntrinsicElements[T]) => {
    const Tag = tag as any;
    const { children, style, ...rest } = props;

    const variantStyles = variantFn ? variantFn(props as P) : {};
    const combinedStyles = { ...baseStyles, ...variantStyles, ...style };

    return (
      <Tag {...rest} style={combinedStyles}>
        {children}
      </Tag>
    );
  };
}

interface ButtonVariants {
  variant: 'primary' | 'secondary';
  fullWidth?: boolean;
}

const Button = createStyledComponent<'button', ButtonVariants>(
  'button',
  {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  (props) => ({
    backgroundColor: props.variant === 'primary' ? '#007bff' : '#6c757d',
    color: 'white',
    width: props.fullWidth ? '100%' : 'auto'
  })
);
```

## Component Composition

### Extending Styled Components

```typescript
const BaseButton = styled('button', {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s'
});

const PrimaryButton = styled('button', {
  ...BaseButton({}).props.style,
  backgroundColor: '#007bff',
  color: 'white'
});

const OutlineButton = styled('button', {
  ...BaseButton({}).props.style,
  backgroundColor: 'transparent',
  border: '2px solid #007bff',
  color: '#007bff'
});
```

### Composition with Wrapper

```typescript
function withStyles<P extends {}>(
  Component: (props: P) => JSX.Element,
  styles: CSSProperties
) {
  return (props: P) => {
    return (
      <div style={styles}>
        <Component {...props} />
      </div>
    );
  };
}

function Button({ children }: { children: any }) {
  return <button>{children}</button>;
}

const StyledButton = withStyles(Button, {
  padding: '16px',
  backgroundColor: '#f0f0f0',
  borderRadius: '8px'
});
```

## Theme Integration

### Theme Context

```typescript
import { createContext } from '@philjs/core';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: string;
}

const lightTheme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#333333'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px'
  },
  borderRadius: '4px'
};

const ThemeContext = createContext<Theme>();

export function ThemeProvider({ children, theme }: {
  children: any;
  theme: Theme;
}) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return ThemeContext.use();
}
```

### Themed Components

```typescript
function createThemedComponent<T extends keyof JSX.IntrinsicElements, P = {}>(
  tag: T,
  styleFn: (theme: Theme, props: P) => CSSProperties
) {
  return (props: P & JSX.IntrinsicElements[T]) => {
    const theme = useTheme();
    const Tag = tag as any;
    const { children, style, ...rest } = props;

    const themedStyles = styleFn(theme, props as P);

    return (
      <Tag {...rest} style={{ ...themedStyles, ...style }}>
        {children}
      </Tag>
    );
  };
}

interface ButtonProps {
  variant?: 'primary' | 'secondary';
}

const ThemedButton = createThemedComponent<'button', ButtonProps>(
  'button',
  (theme, props) => ({
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: 'none',
    borderRadius: theme.borderRadius,
    backgroundColor:
      props.variant === 'secondary'
        ? theme.colors.secondary
        : theme.colors.primary,
    color: 'white',
    cursor: 'pointer'
  })
);

export function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <ThemedButton variant="primary">Primary</ThemedButton>
      <ThemedButton variant="secondary">Secondary</ThemedButton>
    </ThemeProvider>
  );
}
```

## Dynamic Styles with Signals

### Reactive Styled Components

```typescript
import { signal, memo } from '@philjs/core';

interface AnimatedBoxProps {
  animate?: boolean;
}

function AnimatedBox({ animate }: AnimatedBoxProps) {
  const scale = signal(1);
  const rotation = signal(0);

  const styles = memo(() => ({
    width: '100px',
    height: '100px',
    backgroundColor: '#007bff',
    transform: `scale(${scale()}) rotate(${rotation()}deg)`,
    transition: 'transform 0.3s',
    cursor: 'pointer'
  }));

  const handleClick = () => {
    scale.set(scale() === 1 ? 1.2 : 1);
    rotation.set(rotation() + 90);
  };

  return <div style={styles()} onClick={handleClick} />;
}
```

### State-Based Styling

```typescript
import { signal } from '@philjs/core';

function InteractiveButton({ children }: { children: any }) {
  const hovered = signal(false);
  const pressed = signal(false);

  const styles = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: pressed() ? '#0056b3' : hovered() ? '#0069d9' : '#007bff',
    color: 'white',
    transform: pressed() ? 'scale(0.95)' : 'scale(1)',
    transition: 'all 0.1s',
    cursor: 'pointer'
  };

  return (
    <button
      style={styles}
      onMouseEnter={() => hovered.set(true)}
      onMouseLeave={() => {
        hovered.set(false);
        pressed.set(false);
      }}
      onMouseDown={() => pressed.set(true)}
      onMouseUp={() => pressed.set(false)}
    >
      {children}
    </button>
  );
}
```

## Variants System

### Variant Factory

```typescript
type Variants<V extends string> = Record<V, CSSProperties>;

function createVariants<V extends string>(
  baseStyles: CSSProperties,
  variants: Variants<V>
) {
  return function StyledComponent({ variant, children, ...props }: {
    variant: V;
    children?: any;
    [key: string]: any;
  }) {
    const variantStyles = variants[variant] || {};
    const combinedStyles = { ...baseStyles, ...variantStyles };

    return (
      <div {...props} style={combinedStyles}>
        {children}
      </div>
    );
  };
}

const Alert = createVariants(
  {
    padding: '12px 16px',
    borderRadius: '4px',
    border: '1px solid transparent'
  },
  {
    info: {
      backgroundColor: '#d1ecf1',
      borderColor: '#bee5eb',
      color: '#0c5460'
    },
    success: {
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      color: '#155724'
    },
    warning: {
      backgroundColor: '#fff3cd',
      borderColor: '#ffeeba',
      color: '#856404'
    },
    error: {
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      color: '#721c24'
    }
  }
);

export function App() {
  return (
    <div>
      <Alert variant="info">Info message</Alert>
      <Alert variant="success">Success message</Alert>
      <Alert variant="warning">Warning message</Alert>
      <Alert variant="error">Error message</Alert>
    </div>
  );
}
```

### Compound Variants

```typescript
interface ButtonVariants {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  outlined?: boolean;
}

function getButtonStyles({ variant, size, outlined }: ButtonVariants): CSSProperties {
  const baseStyles: CSSProperties = {
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const variantStyles = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' }
  }[variant];

  const sizeStyles = {
    small: { padding: '4px 8px', fontSize: '12px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' }
  }[size];

  const outlineStyles = outlined
    ? {
        backgroundColor: 'transparent',
        border: `2px solid ${variantStyles.backgroundColor}`,
        color: variantStyles.backgroundColor
      }
    : {};

  return { ...baseStyles, ...variantStyles, ...sizeStyles, ...outlineStyles };
}

const Button = styled<'button', ButtonVariants>('button', getButtonStyles);
```

## Best Practices

### Type Everything

```typescript
// ✅ Fully typed
interface StyledProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
}

const Button = styled<'button', StyledProps>('button', (props) => ({
  backgroundColor: props.variant === 'primary' ? 'blue' : 'gray'
}));

// ❌ Untyped
const Button = styled('button', (props: any) => ({
  backgroundColor: props.variant === 'primary' ? 'blue' : 'gray'
}));
```

### Extract Style Logic

```typescript
// ✅ Reusable style functions
function getVariantStyles(variant: string) {
  const variants = {
    primary: { bg: '#007bff', color: 'white' },
    secondary: { bg: '#6c757d', color: 'white' }
  };
  return variants[variant] || variants.primary;
}

const Button = styled('button', (props) => {
  const variant = getVariantStyles(props.variant);
  return {
    backgroundColor: variant.bg,
    color: variant.color
  };
});

// ❌ Inline logic everywhere
const Button = styled('button', (props) => ({
  backgroundColor: props.variant === 'primary' ? '#007bff' : '#6c757d',
  color: 'white'
}));
```

### Memoize Complex Styles

```typescript
import { memo } from '@philjs/core';

// ✅ Memoize expensive style calculations
function ComplexComponent() {
  const styles = memo(() => ({
    // Complex calculations
    transform: calculateTransform(),
    background: generateGradient()
  }));

  return <div style={styles()} />;
}

// ❌ Recalculate on every render
function ComplexComponent() {
  const styles = {
    transform: calculateTransform(),
    background: generateGradient()
  };

  return <div style={styles} />;
}
```

## Summary

You've learned:

✅ Styled component pattern
✅ Type-safe styles with TypeScript
✅ Dynamic styling with props
✅ Theme integration
✅ Component composition
✅ Variants system
✅ Reactive styles with signals
✅ Best practices

Styled components provide flexible, type-safe styling for PhilJS!

---

**Next:** [Theming →](./theming.md) Build theme systems with dark mode
