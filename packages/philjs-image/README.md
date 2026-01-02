# PhilJS Image

Advanced image optimization for PhilJS with automatic format conversion, responsive sizing, lazy loading, and blur placeholders.

## Features

- **Automatic Format Conversion**: AVIF, WebP with JPEG/PNG fallbacks
- **Image Services**: Pluggable adapters for Sharp, Cloudinary, imgix
- **Blur Placeholders**: Base64, BlurHash, LQIP, dominant color
- **Aspect Ratio Locking**: Prevent layout shift
- **Art Direction**: Different images for different breakpoints
- **Priority Hints**: Optimize LCP with fetchPriority
- **Loading Animations**: Fade, blur, scale transitions
- **Responsive Images**: Automatic srcset generation
- **Lazy Loading**: Intersection Observer-based
- **Build-Time Optimization**: Generate placeholders and metadata

## Installation

```bash
npm install philjs-image
```

### Optional Dependencies

```bash
# For local image processing
npm install sharp

# For BlurHash support
npm install blurhash
```

## Quick Start

```tsx
import { Image } from 'philjs-image';

// Basic usage
<Image
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
/>

// With modern formats
<Image
  src="/images/product.jpg"
  alt="Product"
  width={800}
  height={600}
  formats={['avif', 'webp', 'jpeg']}
  quality={90}
/>

// Priority image for LCP
<Image
  src="/images/hero-banner.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority={true}
  fetchPriority="high"
/>
```

## Core Features

### 1. Image Service API (Astro-style)

PhilJS supports pluggable image transformation services:

```tsx
import { configureImageService } from 'philjs-image';

// Cloudinary
configureImageService('cloudinary', {
  cloudName: 'your-cloud-name',
});

// imgix
configureImageService('imgix', {
  domain: 'your-domain.imgix.net',
});

// Sharp (local)
configureImageService('sharp');
```

### 2. Blur Placeholder Generation

Generate blur placeholders at build time:

```tsx
import { generateBlurPlaceholder } from 'philjs-image';

// Base64 inline placeholder
const blurDataURL = await generateBlurPlaceholder(imageBuffer, {
  type: 'base64',
  width: 10,
  height: 10,
});

// BlurHash
const blurHash = await generateBlurPlaceholder(imageBuffer, {
  type: 'blurhash',
});

// LQIP (Low Quality Image Placeholder)
const lqip = await generateBlurPlaceholder(imageBuffer, {
  type: 'lqip',
  width: 20,
  height: 20,
});

// Dominant color
const dominantColor = await generateBlurPlaceholder(imageBuffer, {
  type: 'dominant-color',
});
```

### 3. Advanced Image Component

```tsx
import { Image } from 'philjs-image';
import type { ArtDirectionSource } from 'philjs-image';

// Aspect ratio locking
<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  aspectRatio="16:9"
  maintainAspectRatio={true}
/>

// Art direction
const artDirection: ArtDirectionSource[] = [
  {
    media: '(max-width: 640px)',
    src: '/hero-mobile.jpg',
    width: 640,
  },
  {
    media: '(min-width: 641px)',
    src: '/hero-desktop.jpg',
    width: 1920,
  },
];

<Image
  src="/hero-desktop.jpg"
  alt="Hero"
  artDirection={artDirection}
/>

// Loading animations
<Image
  src="/photo.jpg"
  alt="Photo"
  loadingAnimation="fade"
  animationDuration={500}
/>

// Priority hints for LCP
<Image
  src="/hero.jpg"
  alt="Hero"
  priority={true}
  fetchPriority="high"
/>
```

## API Reference

### Image Component Props

```tsx
interface ImageProps {
  // Required
  src: string;
  alt: string;

  // Dimensions
  width?: number;
  height?: number;
  aspectRatio?: number | string; // e.g., 16/9 or "16:9"
  maintainAspectRatio?: boolean;

  // Optimization
  quality?: number; // 1-100
  formats?: ImageFormat[]; // ['avif', 'webp', 'jpeg']

  // Responsive
  sizes?: string;
  artDirection?: ArtDirectionSource[];

  // Loading
  loading?: 'lazy' | 'eager' | 'auto';
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';

  // Placeholder
  placeholder?: 'blur' | 'color' | 'none';
  blurDataURL?: string;
  blurHash?: string;
  placeholderColor?: string;

  // Animation
  loadingAnimation?: 'fade' | 'blur' | 'scale' | 'none';
  animationDuration?: number;

  // Fit
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

  // Events
  onLoad?: () => void;
  onError?: (error: Error) => void;
}
```

### Server-Side Functions

```tsx
// Configure optimization
configure({
  formats: ['avif', 'webp', 'jpeg'],
  quality: 85,
  breakpoints: [640, 750, 828, 1080, 1200, 1920],
});

// Optimize image
const buffer = await optimizeImage(input, {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 85,
});

// Get metadata
const metadata = await getMetadata(input);
// { width, height, format, size, aspectRatio, dominantColor }

// Generate responsive set
const set = await generateResponsiveSet(input, {
  formats: ['avif', 'webp', 'jpeg'],
  breakpoints: [640, 750, 828, 1080, 1200, 1920],
});

// Extract dominant color
const color = await extractDominantColor(input);
// '#3366cc'
```

### Image Services

```tsx
// Configure service
configureImageService('cloudinary', {
  cloudName: 'demo',
});

// Get active service
const service = getImageService();

// Generate URL
const url = service.getUrl('/image.jpg', {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 85,
});

// Custom service
class CustomService implements ImageService {
  name = 'custom';

  getUrl(src: string, options: ImageServiceTransformOptions): string {
    // Custom logic
  }
}

configureImageService(new CustomService());
```

## Examples

See [examples/README.md](./examples/README.md) for comprehensive usage examples including:

- Basic image optimization
- Art direction for responsive images
- BlurHash and LQIP placeholders
- Loading animations
- Product cards and galleries
- Hero banners with priority hints
- Build-time image processing
- Image service integration

## Performance Best Practices

1. **Use priority for LCP images**
   ```tsx
   <Image priority={true} fetchPriority="high" />
   ```

2. **Lazy load below-the-fold images**
   ```tsx
   <Image loading="lazy" />
   ```

3. **Generate placeholders at build time**
   ```tsx
   const blurHash = await generateBlurPlaceholder(buffer, { type: 'blurhash' });
   <Image blurHash={blurHash} />
   ```

4. **Use aspect ratios to prevent layout shift**
   ```tsx
   <Image aspectRatio="16:9" maintainAspectRatio={true} />
   ```

5. **Choose optimal formats**
   ```tsx
   <Image formats={['avif', 'webp', 'jpeg']} />
   ```

6. **Use art direction for responsive images**
   ```tsx
   <Image artDirection={[
     { media: '(max-width: 640px)', src: '/mobile.jpg' },
     { media: '(min-width: 641px)', src: '/desktop.jpg' },
   ]} />
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

## Browser Support

- Modern formats (AVIF, WebP) with automatic fallback
- Lazy loading (native + polyfill)
- Aspect ratio (CSS aspect-ratio + fallback)
- Priority hints (fetchpriority attribute)

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./vite, ./image-service
- Source files: packages/philjs-image/src/index.ts, packages/philjs-image/src/vite.ts, packages/philjs-image/src/image-service.ts

### Public API
- Direct exports: CloudinaryImageService, ImageService, ImageServiceMetadata, ImageServiceRegistry, ImageServiceTransformOptions, ImgixImageService, SharpImageService, configureImageService, getFormatPriority, getImageService, imageServiceRegistry, selectOptimalFormat
- Re-exported names: ArtDirectionSource, BlurPlaceholderOptions, CloudinaryImageService, Image, ImageCache, ImageFit, ImageFormat, ImageMetadata, ImageOptimizationConfig, ImagePosition, ImageProps, ImageService, ImageServiceMetadata, ImageServiceRegistry, ImageServiceTransformOptions, ImageTransformOptions, ImgixImageService, LoadingAnimation, LoadingStrategy, OptimizedImage, PlaceholderType, SharpImageService, calculateAspectRatio, configure, configureImageService, createCacheKey, default, extractDominantColor, generateBlurDataURL, generateBlurPlaceholder, generateResponsiveSet, generateSrcSet, getConfig, getDominantColor, getFormatFromSrc, getFormatPriority, getImageService, getMetadata, getOptimizedUrl, getResponsiveSizes, imageServiceRegistry, isExternalUrl, isSharpAvailable, isValidFormat, optimizeImage, selectOptimalFormat
- Re-exported modules: ./Image.js, ./image-service.js, ./optimizer.js, ./types.js, ./utils.js
<!-- API_SNAPSHOT_END -->

## License

MIT

## Related Packages

- [@philjs/core](../philjs-core) - Core reactivity system
- [philjs-ssr](../philjs-ssr) - Server-side rendering
- [philjs-router](../philjs-router) - Routing with code splitting
