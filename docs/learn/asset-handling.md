# Asset Handling

Learn how to work with images, fonts, SVGs, and other static assets in your PhilJS application.

## What You'll Learn

- Importing and using images
- Working with SVGs
- Loading fonts
- Handling other assets
- Build optimizations

## Importing Images

### Basic Image Import

```typescript
import logoUrl from './assets/logo.png';

function Logo() {
  return (
    <img src={logoUrl} alt="Logo" width={200} height={100} />
  );
}
```

**How it works**: Vite processes the image and returns the final URL.

### Multiple Images

```typescript
import hero from './images/hero.jpg';
import avatar from './images/avatar.png';
import icon from './images/icon.svg';

function Header() {
  return (
    <header style={{ backgroundImage: `url(${hero})` }}>
      <img src={avatar} alt="User" />
      <img src={icon} alt="Icon" />
    </header>
  );
}
```

### Dynamic Imports

```typescript
function ProductImage({ productId }: { productId: string }) {
  const imageSrc = new URL(`./products/${productId}.jpg`, import.meta.url).href;

  return <img src={imageSrc} alt="Product" />;
}
```

## Image Optimization

### Responsive Images

```typescript
import imageSm from './hero-sm.jpg';
import imageMd from './hero-md.jpg';
import imageLg from './hero-lg.jpg';

function Hero() {
  return (
    <picture>
      <source media="(max-width: 640px)" srcSet={imageSm} />
      <source media="(max-width: 1024px)" srcSet={imageMd} />
      <img src={imageLg} alt="Hero" style={{ width: '100%' }} />
    </picture>
  );
}
```

### Lazy Loading

```typescript
function LazyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}
```

### Image Component

```typescript
import { signal } from '@philjs/core';

function OptimizedImage({ src, alt, placeholder }: {
  src: string;
  alt: string;
  placeholder?: string;
}) {
  const loaded = signal(false);
  const error = signal(false);

  return (
    <div style={{ position: 'relative' }}>
      {!loaded() && placeholder && (
        <img
          src={placeholder}
          alt={alt}
          style={{ filter: 'blur(10px)', width: '100%' }}
        />
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => loaded.set(true)}
        onError={() => error.set(true)}
        style={{
          width: '100%',
          opacity: loaded() ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
      />

      {error() && <div>Failed to load image</div>}
    </div>
  );
}
```

## SVG Assets

### Inline SVG

```typescript
function Icon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
    </svg>
  );
}
```

### Import as URL

```typescript
import iconUrl from './icon.svg';

function Icon() {
  return <img src={iconUrl} alt="Icon" width={24} height={24} />;
}
```

### Import as Component

```typescript
// If using vite-plugin-svgr
import { ReactComponent as Logo } from './logo.svg';

function Header() {
  return (
    <div>
      <Logo width={200} height={100} />
    </div>
  );
}
```

### SVG Sprite

```typescript
// Create sprite sheet
// sprites.svg contains multiple <symbol> elements
import spriteSrc from './sprites.svg';

function Icon({ name }: { name: string }) {
  return (
    <svg width="24" height="24">
      <use href={`${spriteSrc}#${name}`} />
    </svg>
  );
}

// Usage:
<Icon name="user" />
<Icon name="settings" />
<Icon name="logout" />
```

## Fonts

### Web Fonts

```css
/* src/styles/fonts.css */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont.woff2') format('woff2'),
       url('/fonts/CustomFont.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

```typescript
// Import CSS
import './styles/fonts.css';

function App() {
  return (
    <div style={{ fontFamily: 'CustomFont, sans-serif' }}>
      Text with custom font
    </div>
  );
}
```

### Google Fonts

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Inter', sans-serif;
}
```

### Variable Fonts

```css
@font-face {
  font-family: 'Inter var';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

.title {
  font-family: 'Inter var';
  font-weight: 700;
}
```

## Public Assets

Files in `public/` are served as-is:

```
public/
  favicon.ico
  robots.txt
  logo.png
  data/
    products.json
```

```typescript
// Reference public assets directly
function Favicon() {
  return <link rel="icon" href="/favicon.ico" />;
}

function Logo() {
  return <img src="/logo.png" alt="Logo" />;
}

// Fetch public data
async function loadProducts() {
  const response = await fetch('/data/products.json');
  return response.json();
}
```

## File Types

### JSON

```typescript
import data from './data.json';

function DataView() {
  return (
    <ul>
      {data.items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### CSS

```typescript
import './styles.css';
import moduleStyles from './Component.module.css';

function Component() {
  return (
    <div className={moduleStyles.container}>
      Content
    </div>
  );
}
```

### Text Files

```typescript
import readme from './README.md?raw';

function Docs() {
  return <pre>{readme}</pre>;
}
```

### Worker Scripts

```typescript
import Worker from './worker.ts?worker';

function App() {
  const worker = new Worker();

  worker.postMessage('Hello');
  worker.onmessage = (e) => {
    console.log('Worker said:', e.data);
  };

  return <div>Worker running</div>;
}
```

## Build Optimization

### Asset Inlining

Small assets are inlined as base64:

```typescript
// Vite automatically inlines small assets (< 4kb by default)
import smallIcon from './icon-small.png'; // becomes data URL
import largeImage from './photo.jpg'; // becomes separate file
```

### Asset Hashing

Built assets get hashed filenames for cache busting:

```
dist/assets/
  logo.abc123.png
  hero.def456.jpg
  styles.789xyz.css
```

### Configure in vite.config.ts

```typescript
// vite.config.ts
export default {
  build: {
    assetsInlineLimit: 4096, // 4kb
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
};
```

## CDN Assets

```typescript
const CDN_URL = 'https://cdn.example.com';

function Avatar({ userId }: { userId: string }) {
  return (
    <img
      src={`${CDN_URL}/avatars/${userId}.jpg`}
      alt="Avatar"
      onError={(e) => {
        e.currentTarget.src = '/placeholder-avatar.png';
      }}
    />
  );
}
```

## Icon Systems

### Icon Component Library

```typescript
const icons = {
  user: (
    <svg><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" /></svg>
  ),
  settings: (
    <svg><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58..." /></svg>
  )
};

function Icon({ name, size = 24 }: { name: keyof typeof icons; size?: number }) {
  const icon = icons[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      {icon.props.children}
    </svg>
  );
}

// Usage:
<Icon name="user" size={32} />
```

### Icon Font

```css
/* Using icon font like Font Awesome */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
```

```typescript
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <i className={`fa ${name} ${className}`} />;
}

// Usage:
<Icon name="fa-user" />
<Icon name="fa-cog" className="fa-spin" />
```

## Best Practices

### Optimize Images

```bash
# Use proper formats
- JPEG for photos
- PNG for graphics with transparency
- SVG for icons and logos
- WebP for modern browsers

# Compress images before adding to project
# Use tools like imagemin, squoosh, etc.
```

### Lazy Load Below the Fold

```typescript
function Gallery({ images }: { images: string[] }) {
  return (
    <div>
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          loading={i > 2 ? 'lazy' : 'eager'} // First 3 eager, rest lazy
          alt=""
        />
      ))}
    </div>
  );
}
```

### Use Appropriate Sizes

```typescript
// ❌ Don't use huge images for thumbnails
<img src="/photo-4k.jpg" width={100} height={100} />

// ✅ Use sized-down version
<img src="/photo-thumb.jpg" width={100} height={100} />
```

### Preload Critical Assets

```html
<!-- index.html -->
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.jpg" as="image">
```

## Summary

You've learned:

✅ Importing and using images
✅ Working with SVGs inline and as components
✅ Loading custom fonts
✅ Using public assets
✅ Different file types (JSON, CSS, text, workers)
✅ Build optimizations and caching
✅ CDN integration
✅ Icon systems
✅ Best practices for performance

Proper asset handling is key to fast, professional applications!

---

**Next:** [Lazy Loading Components →](./lazy-loading.md) Split code and load on demand
