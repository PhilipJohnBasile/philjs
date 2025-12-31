# Responsive Design

Build responsive, mobile-first layouts in PhilJS applications.

## What You'll Learn

- Mobile-first approach
- Media queries
- Responsive utilities
- Container queries
- Viewport units
- Responsive images
- Best practices

## Mobile-First Approach

### Basic Breakpoints

```typescript
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
} as const;

// CSS
/*
Mobile: default styles
Tablet: @media (min-width: 768px)
Desktop: @media (min-width: 1024px)
Wide: @media (min-width: 1280px)
*/
```

### Mobile-First Styles

```css
/* Base styles - mobile first */
.container {
  padding: 16px;
  max-width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 720px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 960px;
  }
}

/* Wide screens */
@media (min-width: 1280px) {
  .container {
    padding: 40px;
    max-width: 1200px;
  }
}
```

## Media Queries with Signals

### useMediaQuery Hook

```typescript
import { signal, effect } from '@philjs/core';

function useMediaQuery(query: string) {
  const matches = signal(false);

  effect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    matches.set(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      matches.set(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  });

  return matches;
}

// Usage
export function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div>
      {isMobile() && <MobileLayout />}
      {isTablet() && <TabletLayout />}
      {isDesktop() && <DesktopLayout />}
    </div>
  );
}
```

### Breakpoint Hooks

```typescript
function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const breakpoint = () => {
    if (isMobile()) return 'mobile';
    if (isTablet()) return 'tablet';
    if (isDesktop()) return 'desktop';
    return 'mobile';
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint
  };
}

export function AdaptiveComponent() {
  const { breakpoint } = useBreakpoint();

  const columns = () => {
    switch (breakpoint()) {
      case 'mobile':
        return 1;
      case 'tablet':
        return 2;
      case 'desktop':
        return 3;
      default:
        return 1;
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns()}, 1fr)`,
        gap: '16px'
      }}
    >
      {items.map((item) => (
        <Card key={item.id} {...item} />
      ))}
    </div>
  );
}
```

## Responsive Grid

### CSS Grid

```typescript
export function ResponsiveGrid({ children }: { children: any }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        padding: '24px'
      }}
    >
      {children}
    </div>
  );
}
```

### Dynamic Grid

```typescript
import { signal } from '@philjs/core';

export function DynamicGrid({ children }: { children: any }) {
  const columns = signal(3);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  effect(() => {
    if (isMobile()) columns.set(1);
    else if (isTablet()) columns.set(2);
    else columns.set(3);
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns()}, 1fr)`,
        gap: '16px'
      }}
    >
      {children}
    </div>
  );
}
```

## Flexbox Patterns

### Responsive Flex Direction

```typescript
export function ResponsiveFlex({ children }: { children: any }) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile() ? 'column' : 'row',
        gap: '16px',
        alignItems: isMobile() ? 'stretch' : 'center'
      }}
    >
      {children}
    </div>
  );
}
```

### Responsive Wrap

```typescript
export function ResponsiveWrap({ children }: { children: any }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center'
      }}
    >
      {children}
    </div>
  );
}
```

## Container Queries

### Container Query Pattern

```css
/* Component container */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Component adapts to container size */
@container card (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }

  .card-image {
    width: 200px;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }

  .card-image {
    width: 100%;
  }
}
```

```typescript
export function ResponsiveCard({ title, image, content }: {
  title: string;
  image: string;
  content: string;
}) {
  return (
    <div className="card-container">
      <div className="card">
        <img src={image} alt={title} className="card-image" />
        <div className="card-content">
          <h3>{title}</h3>
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
}
```

## Responsive Typography

### Fluid Typography

```css
/* Fluid font size using clamp() */
.heading {
  font-size: clamp(1.5rem, 2vw + 1rem, 3rem);
}

.body {
  font-size: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
  line-height: 1.6;
}
```

```typescript
export function ResponsiveTypography() {
  return (
    <div>
      <h1
        style={{
          fontSize: 'clamp(1.5rem, 2vw + 1rem, 3rem)',
          marginBottom: '1rem'
        }}
      >
        Responsive Heading
      </h1>
      <p
        style={{
          fontSize: 'clamp(1rem, 0.5vw + 0.875rem, 1.125rem)',
          lineHeight: '1.6'
        }}
      >
        This text scales smoothly with viewport size.
      </p>
    </div>
  );
}
```

### Breakpoint-Based Typography

```typescript
export function BreakpointTypography({ children }: { children: any }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const fontSize = () => {
    if (isMobile()) return '14px';
    if (isTablet()) return '16px';
    return '18px';
  };

  return (
    <p style={{ fontSize: fontSize(), lineHeight: '1.6' }}>
      {children}
    </p>
  );
}
```

## Responsive Images

### Picture Element

```typescript
export function ResponsiveImage({ alt }: { alt: string }) {
  return (
    <picture>
      <source
        media="(min-width: 1024px)"
        srcSet="/images/hero-large.jpg"
      />
      <source
        media="(min-width: 768px)"
        srcSet="/images/hero-medium.jpg"
      />
      <img
        src="/images/hero-small.jpg"
        alt={alt}
        style={{ width: '100%', height: 'auto' }}
      />
    </picture>
  );
}
```

### Srcset Pattern

```typescript
export function OptimizedImage({ src, alt }: {
  src: string;
  alt: string;
}) {
  return (
    <img
      src={src}
      srcSet={`
        ${src}?w=400 400w,
        ${src}?w=800 800w,
        ${src}?w=1200 1200w
      `}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      alt={alt}
      style={{ width: '100%', height: 'auto' }}
    />
  );
}
```

## Viewport Units

### Full Height Layout

```typescript
export function FullHeightLayout({ children }: { children: any }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '100dvh', // Dynamic viewport height (mobile)
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <header style={{ padding: '20px' }}>Header</header>
      <main style={{ flex: 1, padding: '20px' }}>{children}</main>
      <footer style={{ padding: '20px' }}>Footer</footer>
    </div>
  );
}
```

### Responsive Spacing

```typescript
export function ResponsiveSpacing({ children }: { children: any }) {
  return (
    <div
      style={{
        padding: 'clamp(1rem, 5vw, 3rem)',
        margin: '0 auto',
        maxWidth: '1200px'
      }}
    >
      {children}
    </div>
  );
}
```

## Navigation Patterns

### Responsive Nav

```typescript
import { signal } from '@philjs/core';

export function ResponsiveNav() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isOpen = signal(false);

  if (isMobile()) {
    return (
      <nav>
        <button onClick={() => isOpen.set(!isOpen())}>
          {isOpen() ? '✕' : '☰'}
        </button>

        {isOpen() && (
          <div
            style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
              padding: '20px'
            }}
          >
            <NavLinks />
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav style={{ display: 'flex', gap: '20px' }}>
      <NavLinks />
    </nav>
  );
}

function NavLinks() {
  return (
    <>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </>
  );
}
```

## Responsive Utilities

### Show/Hide by Breakpoint

```typescript
export function HideOnMobile({ children }: { children: any }) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile()) return null;

  return <>{children}</>;
}

export function ShowOnMobile({ children }: { children: any }) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!isMobile()) return null;

  return <>{children}</>;
}

// Usage
export function App() {
  return (
    <div>
      <HideOnMobile>
        <DesktopSidebar />
      </HideOnMobile>

      <ShowOnMobile>
        <MobileMenu />
      </ShowOnMobile>
    </div>
  );
}
```

### Responsive Wrapper

```typescript
import type { CSSProperties } from '@philjs/core';

interface ResponsiveProps {
  mobile?: CSSProperties;
  tablet?: CSSProperties;
  desktop?: CSSProperties;
  children: any;
}

export function Responsive({ mobile, tablet, desktop, children }: ResponsiveProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const styles = () => {
    if (isMobile() && mobile) return mobile;
    if (isTablet() && tablet) return tablet;
    if (desktop) return desktop;
    return {};
  };

  return <div style={styles()}>{children}</div>;
}

// Usage
<Responsive
  mobile={{ padding: '8px', fontSize: '14px' }}
  tablet={{ padding: '16px', fontSize: '16px' }}
  desktop={{ padding: '24px', fontSize: '18px' }}
>
  <Content />
</Responsive>
```

## Best Practices

### Mobile-First

```css
/* ✅ Mobile-first (scales up) */
.element {
  padding: 16px;
}

@media (min-width: 768px) {
  .element {
    padding: 24px;
  }
}

/* ❌ Desktop-first (scales down) */
.element {
  padding: 24px;
}

@media (max-width: 767px) {
  .element {
    padding: 16px;
  }
}
```

### Use Relative Units

```typescript
// ✅ Relative units
<div style={{
  padding: '1rem',
  fontSize: '1.125rem',
  maxWidth: '60ch'
}} />

// ❌ Fixed pixels
<div style={{
  padding: '16px',
  fontSize: '18px',
  maxWidth: '960px'
}} />
```

### Touch-Friendly Targets

```typescript
// ✅ Minimum 44x44px tap targets
<button style={{
  minWidth: '44px',
  minHeight: '44px',
  padding: '12px 24px'
}}>
  Click me
</button>

// ❌ Too small for touch
<button style={{
  padding: '4px 8px'
}}>
  Click
</button>
```

### Test on Real Devices

```typescript
// ✅ Test actual devices
// - iPhone SE (small)
// - iPhone 14 Pro (medium)
// - iPad (tablet)
// - Desktop

// ❌ Only test in browser devtools
```

### Performance on Mobile

```typescript
// ✅ Lazy load images
<img
  loading="lazy"
  src="/large-image.jpg"
  alt="Description"
/>

// ✅ Reduce animations on mobile
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

<div style={{
  transition: prefersReducedMotion() ? 'none' : 'all 0.3s'
}} />
```

## Summary

You've learned:

✅ Mobile-first responsive design
✅ Media queries with signals
✅ Responsive grid and flexbox
✅ Container queries
✅ Fluid typography
✅ Responsive images
✅ Viewport units
✅ Navigation patterns
✅ Responsive utilities
✅ Best practices

Build responsive, mobile-friendly PhilJS applications!

---

**Styling Section Complete!** You've mastered all styling approaches in PhilJS.
