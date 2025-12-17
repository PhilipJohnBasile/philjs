# philjs-image

Image optimization for PhilJS with automatic format conversion, responsive sizing, and lazy loading.

## Features

- ✅ Automatic WebP/AVIF conversion
- ✅ Responsive image generation
- ✅ Lazy loading with intersection observer
- ✅ Blur placeholders
- ✅ Priority loading for above-the-fold images
- ✅ Vite plugin for build-time optimization
- ✅ Sharp integration for server-side processing

## Installation

```bash
npm install philjs-image sharp
```

## Usage

### Basic Usage

```tsx
import { Image } from 'philjs-image';

function MyComponent() {
  return (
    <Image
      src="/photo.jpg"
      alt="Description"
      width={800}
      height={600}
      loading="lazy"
    />
  );
}
```

### With Responsive Sizing

```tsx
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1920}
  height={1080}
  sizes="(max-width: 768px) 100vw, 50vw"
  formats={['avif', 'webp', 'jpeg']}
/>
```

### With Blur Placeholder

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Priority Loading

```tsx
<Image
  src="/above-fold.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority
  loading="eager"
/>
```

## Vite Plugin

Add to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';
import philjsImage from 'philjs-image/vite';

export default defineConfig({
  plugins: [
    philjs(),
    philjsImage({
      formats: ['avif', 'webp', 'jpeg'],
      quality: 85,
      breakpoints: [640, 750, 828, 1080, 1200, 1920],
    })
  ]
});
```

## API

See [full API documentation](https://philjs.dev/api/image).

## License

MIT
