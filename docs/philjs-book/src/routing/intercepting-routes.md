# Intercepting Routes

Intercepting routes allow you to load a route from another part of your application while keeping the user in their current context. This is perfect for modals, drawers, and overlays that maintain the background page state.


## Basic Interception

### Intercept Convention

Use `(.)` notation to intercept routes:

- `(.)` - same level
- `(..)` - one level up
- `(..)(..)` - two levels up
- `(...)` - from root

```
routes/
  photos/
    [id]/
      index.tsx        → /photos/123
    (.)[id]/
      index.tsx        → Intercepts /photos/123
    index.tsx          → /photos
```

### Photo Modal Example

```tsx
// routes/photos/index.tsx
export default function PhotoGrid() {
  const photos = signal([/* ... */]);

  return (
    <div class="grid">
      {photos().map(photo => (
        <Link key={photo.id} href={`/photos/${photo.id}`}>
          <img src={photo.thumbnail} alt={photo.title} />
        </Link>
      ))}
    </div>
  );
}

// routes/photos/(.)[id]/index.tsx - Intercepts the route
export default function PhotoModal({ params }) {
  const navigate = useNavigate();

  return (
    <div class="modal-backdrop" onClick={() => navigate('/photos')}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <img src={`/api/photos/${params.id}`} alt="Photo" />
        <button onClick={() => navigate('/photos')}>Close</button>
      </div>
    </div>
  );
}

// routes/photos/[id]/index.tsx - Direct navigation shows full page
export default function PhotoPage({ params }) {
  return (
    <div class="photo-page">
      <img src={`/api/photos/${params.id}`} alt="Photo" />
      <Link href="/photos">Back to Grid</Link>
    </div>
  );
}
```

## Login Modal

### Intercept Login Route

```tsx
// routes/(.)login/index.tsx
import { useNavigate } from '@philjs/router';

export default function LoginModal() {
  const navigate = useNavigate();
  const [email, setEmail] = signal('');
  const [password, setPassword] = signal('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email(), password());
    navigate(-1); // Go back to previous page
  };

  return (
    <div class="modal-backdrop">
      <div class="modal">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email()}
            onInput={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="submit">Login</button>
        </form>
        <button onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  );
}

// routes/login/index.tsx - Full page login
export default function LoginPage() {
  return (
    <div class="login-page">
      <h1>Login</h1>
      <LoginForm />
    </div>
  );
}
```

## E-Commerce Product Quick View

### Quick View Modal

```tsx
// routes/products/(.)[id]/index.tsx
export const loader = createDataLoader(async ({ params }) => {
  const product = await db.products.findById(params.id);
  return { product };
});

export default function ProductQuickView({ data }) {
  const navigate = useNavigate();

  return (
    <div class="quick-view-modal">
      <div class="modal-content">
        <img src={data.product.image} alt={data.product.name} />
        <h2>{data.product.name}</h2>
        <p>{data.product.description}</p>
        <p class="price">${data.product.price}</p>

        <div class="actions">
          <button>Add to Cart</button>
          <Link href={`/products/${data.product.id}`}>
            View Full Details
          </Link>
        </div>

        <button class="close" onClick={() => navigate(-1)}>
          ×
        </button>
      </div>
    </div>
  );
}

// routes/products/[id]/index.tsx - Full product page
export default function ProductPage({ data }) {
  return (
    <div class="product-page">
      <ProductGallery images={data.product.images} />
      <ProductDetails product={data.product} />
      <ProductReviews productId={data.product.id} />
      <RelatedProducts category={data.product.category} />
    </div>
  );
}
```

## Share Dialog

### Intercept Share Route

```tsx
// routes/posts/[id]/(.)share/index.tsx
export default function ShareDialog({ params }) {
  const navigate = useNavigate();
  const url = `${window.location.origin}/posts/${params.id}`;

  const share = (platform: string) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
      facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    window.open(urls[platform], '_blank');
    navigate(-1);
  };

  return (
    <div class="share-dialog">
      <h3>Share this post</h3>
      <button onClick={() => share('twitter')}>Share on Twitter</button>
      <button onClick={() => share('facebook')}>Share on Facebook</button>
      <button onClick={() => share('linkedin')}>Share on LinkedIn</button>
      <button onClick={() => navigator.clipboard.writeText(url)}>
        Copy Link
      </button>
      <button onClick={() => navigate(-1)}>Cancel</button>
    </div>
  );
}
```

## Settings Drawer

### Side Drawer Interception

```tsx
// routes/(..)settings/index.tsx
export default function SettingsDrawer() {
  const navigate = useNavigate();
  const [theme, setTheme] = signal('light');

  return (
    <>
      <div class="drawer-backdrop" onClick={() => navigate(-1)} />
      <div class="drawer">
        <h2>Quick Settings</h2>

        <div class="setting">
          <label>Theme</label>
          <select value={theme()} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <Link href="/settings">Full Settings</Link>
        <button onClick={() => navigate(-1)}>Close</button>
      </div>
    </>
  );
}

// routes/settings/index.tsx - Full settings page
export default function SettingsPage() {
  return (
    <div class="settings-page">
      <h1>Settings</h1>
      <SettingsSections />
    </div>
  );
}
```

## Preserving State

### Background State Management

```tsx
// routes/feed/index.tsx
export default function Feed() {
  const scrollPosition = signal(0);
  const selectedFilter = signal('all');

  const handleScroll = (e) => {
    scrollPosition.set(e.target.scrollTop);
  };

  return (
    <div onScroll={handleScroll}>
      <FilterBar value={selectedFilter()} onChange={selectedFilter.set} />

      {posts().map(post => (
        <Link key={post.id} href={`/feed/(..)posts/${post.id}`}>
          <PostCard post={post} />
        </Link>
      ))}
    </div>
  );
}

// When returning from modal, state is preserved:
// - Scroll position maintained
// - Filter selection preserved
// - Feed data cached
```

## Nested Interceptions

### Multi-Level Interception

```tsx
// routes/dashboard/(..)analytics/(.)chart/[id]/index.tsx
export default function ChartModal({ params }) {
  const navigate = useNavigate();

  return (
    <div class="modal">
      <h2>Chart Details</h2>
      <Chart id={params.id} />
      <button onClick={() => navigate(-2)}>
        Back to Dashboard
      </button>
    </div>
  );
}
```

## Conditional Interception

### Device-Based Interception

```tsx
// routes/products/(.)[id]/index.tsx
export default function ProductRoute({ params }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile()) {
    // Mobile: show full page
    return <Redirect to={`/products/${params.id}`} />;
  }

  // Desktop: show modal
  return <ProductQuickView productId={params.id} />;
}
```

## Best Practices

### ✅ Do: Preserve Background State

```tsx
// ✅ Good - use interception to keep state
<Link href="/(..)photo/123">View Photo</Link>
// Background page state is preserved

// ❌ Bad - loses state
<Link href="/photo/123">View Photo</Link>
// Background page unmounts
```

### ✅ Do: Provide Full Page Alternative

```tsx
// ✅ Good - both modal and full page
routes/
  products/
    (.)[id]/index.tsx    // Modal
    [id]/index.tsx       // Full page
```

### ✅ Do: Handle Direct Navigation

```tsx
// ✅ Good - handle both cases
export default function PhotoRoute({ params }) {
  const fromGrid = useNavigationSource() === '/photos';

  if (fromGrid) {
    return <PhotoModal id={params.id} />;
  }

  return <PhotoPage id={params.id} />;
}
```

### ❌ Don't: Intercept Critical Flows

```tsx
// ❌ Bad - don't intercept important flows
routes/
  (.)checkout/         // Payment should be full page

// ✅ Good - use modals for quick views only
routes/
  (.)product-preview/  // Preview in modal
  checkout/            // Full checkout page
```

## Next Steps

- [Parallel Routes](./parallel-routes.md) - Render multiple routes
- [Modal Patterns](../best-practices/component-patterns.md) - Modal best practices
- [View Transitions](./view-transitions.md) - Smooth transitions
- [Navigation](./navigation.md) - Advanced navigation

---

💡 **Tip**: Use intercepting routes for quick views that should preserve the background page state.

⚠️ **Warning**: Always provide a full-page alternative for intercepted routes in case users refresh or share the URL.

ℹ️ **Note**: Intercepted routes maintain scroll position and state of the background page, providing a seamless UX.

