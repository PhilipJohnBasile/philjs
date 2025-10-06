# View Transitions

Create smooth, app-like animations between routes using the View Transitions API.

## What You'll Learn

- View Transitions API
- Route transitions
- Custom animations
- Shared element transitions
- Fallback animations
- Best practices

## What are View Transitions?

View Transitions provide native browser animations between pages, creating smooth visual continuity during navigation.

**Benefits:**
- Native browser API (performant)
- Smooth cross-fade by default
- Shared element transitions
- Accessible (respects `prefers-reduced-motion`)

## Basic Transitions

### Enable View Transitions

```typescript
// src/App.tsx
import { Router } from 'philjs-router';

export default function App() {
  return (
    <Router
      viewTransitions={true} // Enable view transitions
    />
  );
}
```

That's it! Routes now cross-fade smoothly.

### Manual Transition

```typescript
import { useRouter } from 'philjs-router';

function Navigation() {
  const router = useRouter();

  const navigateWithTransition = async (href: string) => {
    if (document.startViewTransition) {
      await document.startViewTransition(() => {
        router.push(href);
      });
    } else {
      router.push(href);
    }
  };

  return (
    <nav>
      <button onClick={() => navigateWithTransition('/about')}>
        About
      </button>
    </nav>
  );
}
```

## Custom Animations

### Slide Transition

```css
/* Default cross-fade */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* Slide from right */
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
  animation: 0.3s ease-out both slide-to-left;
}

::view-transition-new(root) {
  animation: 0.3s ease-out both slide-from-right;
}
```

### Fade and Scale

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes fade-out {
  to {
    opacity: 0;
  }
}

@keyframes scale-up {
  from {
    transform: scale(0.95);
  }
}

::view-transition-old(root) {
  animation: 0.25s ease-out both fade-out;
}

::view-transition-new(root) {
  animation: 0.25s ease-out both fade-in, 0.25s ease-out both scale-up;
}
```

## Directional Transitions

### Forward/Back Navigation

```typescript
import { useRouter } from 'philjs-router';
import { signal, effect } from 'philjs-core';

const navigationDirection = signal<'forward' | 'back'>('forward');

export default function App() {
  const router = useRouter();

  effect(() => {
    const handleNavigation = (event: any) => {
      // Detect direction based on history state
      const direction = event.direction || 'forward';
      navigationDirection.set(direction);

      document.documentElement.setAttribute('data-direction', direction);
    };

    router.events.on('routeChangeStart', handleNavigation);

    return () => {
      router.events.off('routeChangeStart', handleNavigation);
    };
  });

  return <Router viewTransitions={true} />;
}
```

```css
/* Forward navigation - slide left */
[data-direction='forward'] ::view-transition-old(root) {
  animation: 0.3s ease-out both slide-to-left;
}

[data-direction='forward'] ::view-transition-new(root) {
  animation: 0.3s ease-out both slide-from-right;
}

/* Back navigation - slide right */
[data-direction='back'] ::view-transition-old(root) {
  animation: 0.3s ease-out both slide-to-right;
}

[data-direction='back'] ::view-transition-new(root) {
  animation: 0.3s ease-out both slide-from-left;
}

@keyframes slide-to-left {
  to { transform: translateX(-100%); }
}

@keyframes slide-from-right {
  from { transform: translateX(100%); }
}

@keyframes slide-to-right {
  to { transform: translateX(100%); }
}

@keyframes slide-from-left {
  from { transform: translateX(-100%); }
}
```

## Shared Element Transitions

### Basic Shared Element

```typescript
// src/pages/products/index.tsx
export default function ProductList() {
  return (
    <div className="product-grid">
      {products.map(product => (
        <Link
          href={`/products/${product.id}`}
          key={product.id}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{ viewTransitionName: `product-${product.id}` }}
          />
          <h3>{product.name}</h3>
        </Link>
      ))}
    </div>
  );
}
```

```typescript
// src/pages/products/[id].tsx
import { useParams } from 'philjs-router';

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);

  return (
    <div className="product-detail">
      <img
        src={product.image}
        alt={product.name}
        style={{ viewTransitionName: `product-${product.id}` }}
      />
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

The image smoothly morphs from thumbnail to full size!

### Hero Image Transition

```typescript
// List page
function PostCard({ post }: { post: Post }) {
  return (
    <article>
      <img
        src={post.coverImage}
        style={{ viewTransitionName: `post-hero-${post.id}` }}
        alt={post.title}
      />
      <h2>{post.title}</h2>
    </article>
  );
}

// Detail page
function PostDetail({ post }: { post: Post }) {
  return (
    <article>
      <img
        src={post.coverImage}
        style={{ viewTransitionName: `post-hero-${post.id}` }}
        alt={post.title}
        className="hero-image"
      />
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### Multiple Shared Elements

```typescript
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card">
      <img
        src={product.image}
        style={{ viewTransitionName: `product-image-${product.id}` }}
      />
      <h3 style={{ viewTransitionName: `product-title-${product.id}` }}>
        {product.name}
      </h3>
      <p style={{ viewTransitionName: `product-price-${product.id}` }}>
        ${product.price}
      </p>
    </div>
  );
}
```

## Transition Types

### Page Type Transitions

```typescript
// Add data attribute for page type
export default function BlogPost() {
  effect(() => {
    document.documentElement.setAttribute('data-page-type', 'blog-post');
  });

  return <article>...</article>;
}
```

```css
/* Different animation for blog posts */
[data-page-type='blog-post'] ::view-transition-new(root) {
  animation: 0.5s ease-out both fade-in;
}

/* Different animation for products */
[data-page-type='product'] ::view-transition-new(root) {
  animation: 0.3s ease-out both slide-from-right;
}
```

### Route-Based Transitions

```typescript
import { usePathname } from 'philjs-router';
import { effect } from 'philjs-core';

export default function Layout({ children }: { children: any }) {
  const pathname = usePathname();

  effect(() => {
    // Set transition type based on route
    if (pathname.startsWith('/blog')) {
      document.documentElement.setAttribute('data-transition', 'fade');
    } else if (pathname.startsWith('/products')) {
      document.documentElement.setAttribute('data-transition', 'slide');
    } else {
      document.documentElement.setAttribute('data-transition', 'default');
    }
  });

  return <div>{children}</div>;
}
```

## Performance Optimization

### Skip Transition for Certain Routes

```typescript
import { useRouter } from 'philjs-router';

function Navigation() {
  const router = useRouter();

  const navigate = (href: string, useTransition = true) => {
    if (useTransition && document.startViewTransition) {
      document.startViewTransition(() => {
        router.push(href);
      });
    } else {
      router.push(href);
    }
  };

  return (
    <nav>
      <button onClick={() => navigate('/dashboard', true)}>
        Dashboard
      </button>
      {/* Skip transition for quick actions */}
      <button onClick={() => navigate('/settings', false)}>
        Settings
      </button>
    </nav>
  );
}
```

### Reduce Motion

```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Advanced Patterns

### Conditional Shared Elements

```typescript
import { useRouter } from 'philjs-router';
import { signal } from 'philjs-core';

const enableSharedElement = signal(true);

function ProductCard({ product }: { product: Product }) {
  const transitionName = enableSharedElement()
    ? `product-${product.id}`
    : undefined;

  return (
    <div>
      <img
        src={product.image}
        style={{ viewTransitionName: transitionName }}
      />
    </div>
  );
}
```

### Cleanup Transition Names

```typescript
import { effect } from 'philjs-core';

function ProductDetail({ product }: { product: Product }) {
  effect(() => {
    // Set transition name
    const img = document.querySelector('.product-image') as HTMLElement;
    if (img) {
      img.style.viewTransitionName = `product-${product.id}`;
    }

    // Cleanup
    return () => {
      if (img) {
        img.style.viewTransitionName = '';
      }
    };
  });

  return (
    <img src={product.image} className="product-image" />
  );
}
```

### Nested Transitions

```typescript
export default function Layout({ children }: { children: any }) {
  return (
    <div>
      <header style={{ viewTransitionName: 'header' }}>
        <Logo />
        <Navigation />
      </header>

      <main style={{ viewTransitionName: 'main-content' }}>
        {children}
      </main>

      <footer style={{ viewTransitionName: 'footer' }}>
        <FooterContent />
      </footer>
    </div>
  );
}
```

## Fallback for Unsupported Browsers

### Progressive Enhancement

```typescript
import { useRouter } from 'philjs-router';

function useViewTransition() {
  const router = useRouter();

  const navigate = async (href: string) => {
    // Use View Transitions if supported
    if (document.startViewTransition) {
      await document.startViewTransition(() => {
        router.push(href);
      });
    } else {
      // Fallback: CSS transitions
      document.body.classList.add('page-transitioning');

      await new Promise(resolve => setTimeout(resolve, 300));

      router.push(href);

      setTimeout(() => {
        document.body.classList.remove('page-transitioning');
      }, 300);
    }
  };

  return { navigate };
}
```

```css
/* Fallback CSS transition */
body.page-transitioning {
  animation: fade-out 0.3s ease-out;
}

@keyframes fade-out {
  to {
    opacity: 0;
  }
}
```

### Feature Detection

```typescript
const supportsViewTransitions = () => {
  return 'startViewTransition' in document;
};

export default function App() {
  return (
    <Router
      viewTransitions={supportsViewTransitions()}
    />
  );
}
```

## Complete Examples

### E-commerce Product Transition

```typescript
// Product list
export default function ProductList() {
  const products = getProducts();

  return (
    <div className="product-grid">
      {products.map(product => (
        <Link
          href={`/products/${product.id}`}
          key={product.id}
          className="product-card"
        >
          <img
            src={product.image}
            style={{ viewTransitionName: `product-img-${product.id}` }}
            alt={product.name}
          />
          <h3 style={{ viewTransitionName: `product-name-${product.id}` }}>
            {product.name}
          </h3>
          <p className="price">${product.price}</p>
        </Link>
      ))}
    </div>
  );
}

// Product detail
export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);

  return (
    <div className="product-detail">
      <img
        src={product.image}
        style={{ viewTransitionName: `product-img-${product.id}` }}
        className="product-hero"
      />

      <div className="product-info">
        <h1 style={{ viewTransitionName: `product-name-${product.id}` }}>
          {product.name}
        </h1>

        <p className="price">${product.price}</p>
        <p className="description">{product.description}</p>

        <button className="add-to-cart">Add to Cart</button>
      </div>
    </div>
  );
}
```

### Blog Post Transition

```typescript
// Blog list
function BlogList() {
  return (
    <div className="blog-posts">
      {posts.map(post => (
        <article key={post.id}>
          <Link href={`/blog/${post.slug}`}>
            <img
              src={post.coverImage}
              style={{ viewTransitionName: `post-cover-${post.id}` }}
            />
            <h2 style={{ viewTransitionName: `post-title-${post.id}` }}>
              {post.title}
            </h2>
            <p>{post.excerpt}</p>
          </Link>
        </article>
      ))}
    </div>
  );
}

// Blog post
function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = getPostBySlug(params.slug);

  return (
    <article className="blog-post">
      <img
        src={post.coverImage}
        style={{ viewTransitionName: `post-cover-${post.id}` }}
        className="cover-image"
      />

      <h1 style={{ viewTransitionName: `post-title-${post.id}` }}>
        {post.title}
      </h1>

      <div className="post-content">
        {post.content}
      </div>
    </article>
  );
}
```

## Best Practices

### Use Unique Transition Names

```typescript
// ✅ Unique per item
style={{ viewTransitionName: `product-${product.id}` }}

// ❌ Same name for multiple elements
style={{ viewTransitionName: 'product-image' }}
```

### Keep Animations Short

```css
/* ✅ Quick and snappy */
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* ❌ Too slow */
::view-transition-new(root) {
  animation-duration: 1s;
}
```

### Respect Motion Preferences

```css
/* ✅ Disable for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

### Clean Up Transition Names

```typescript
// ✅ Remove when component unmounts
effect(() => {
  element.style.viewTransitionName = 'my-element';

  return () => {
    element.style.viewTransitionName = '';
  };
});
```

### Test Fallbacks

```typescript
// ✅ Provide CSS fallback
if (!document.startViewTransition) {
  // Use CSS transitions instead
  document.body.classList.add('transitioning');
  setTimeout(() => {
    document.body.classList.remove('transitioning');
  }, 300);
}
```

## Browser Support

View Transitions API is supported in:
- Chrome 111+
- Edge 111+
- Safari 18+ (limited)

**Fallback:** Always provide CSS transitions for unsupported browsers.

## Summary

You've learned:

✅ View Transitions API basics
✅ Route transition animations
✅ Custom transition styles
✅ Shared element transitions
✅ Directional animations
✅ Performance optimization
✅ Fallbacks for unsupported browsers
✅ Advanced patterns
✅ Best practices

View Transitions create polished, app-like experiences!

---

**Next:** [API Routes →](./api-routes.md) Build backend endpoints alongside your pages
