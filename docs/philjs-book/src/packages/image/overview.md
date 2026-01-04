# @philjs/image

The `@philjs/image` package provides automatic image optimization with format conversion, responsive sizing, lazy loading, and blur placeholders.

## Installation

```bash
npm install @philjs/image
```

## Features

- **Automatic Optimization** - Format conversion to WebP/AVIF
- **Responsive Images** - srcset and sizes generation
- **Lazy Loading** - Native lazy loading support
- **Blur Placeholders** - LQIP (Low Quality Image Placeholder)
- **Priority Loading** - Preload critical images
- **Image Services** - Sharp, Cloudinary, Imgix adapters
- **SSR Support** - Server-side image processing

## Quick Start

```typescript
import { Image } from '@philjs/image';

function Gallery() {
  return (
    <div class="gallery">
      {/* Basic optimized image */}
      <Image
        src="/photos/hero.jpg"
        alt="Hero image"
        width={1200}
        height={800}
      />

      {/* Priority image (above the fold) */}
      <Image
        src="/photos/banner.jpg"
        alt="Banner"
        width={1920}
        height={600}
        priority
      />

      {/* With blur placeholder */}
      <Image
        src="/photos/product.jpg"
        alt="Product"
        width={400}
        height={400}
        placeholder="blur"
      />
    </div>
  );
}
```

---

## Image Component

### Props

```typescript
interface ImageProps {
  /** Image source URL */
  src: string;

  /** Alt text (required for accessibility) */
  alt: string;

  /** Width in pixels */
  width?: number;

  /** Height in pixels */
  height?: number;

  /** Quality (1-100), default 85 */
  quality?: number;

  /** Output formats, default ['webp', 'jpeg'] */
  formats?: ImageFormat[];

  /** sizes attribute for responsive images */
  sizes?: string;

  /** Loading strategy: 'lazy' | 'eager' */
  loading?: LoadingStrategy;

  /** Preload as priority image */
  priority?: boolean;

  /** Placeholder type: 'blur' | 'color' | 'none' */
  placeholder?: PlaceholderType;

  /** Custom blur data URL */
  blurDataURL?: string;

  /** Solid color placeholder */
  placeholderColor?: string;

  /** Object-fit behavior */
  fit?: ImageFit;

  /** CSS class name */
  className?: string;

  /** Inline styles */
  style?: Record<string, string>;

  /** Load callback */
  onLoad?: () => void;

  /** Error callback */
  onError?: (error: Error) => void;

  /** Skip optimization */
  unoptimized?: boolean;

  /** CORS setting */
  crossOrigin?: 'anonymous' | 'use-credentials';

  /** Referrer policy */
  referrerPolicy?: ReferrerPolicy;

  /** Decoding hint: 'sync' | 'async' | 'auto' */
  decoding?: 'sync' | 'async' | 'auto';
}

type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'gif';
type ImageFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
type LoadingStrategy = 'lazy' | 'eager';
type PlaceholderType = 'blur' | 'color' | 'none';
```

### Basic Usage

```typescript
import { Image } from '@philjs/image';

// Simple image
<Image
  src="/images/photo.jpg"
  alt="Photo description"
  width={800}
  height={600}
/>

// Full-width responsive
<Image
  src="/images/banner.jpg"
  alt="Banner"
  width={1920}
  height={400}
  sizes="100vw"
/>

// Constrained width
<Image
  src="/images/product.jpg"
  alt="Product"
  width={400}
  height={400}
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

### Priority Images

For above-the-fold images (LCP optimization):

```typescript
// Preloaded for fast LCP
<Image
  src="/images/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>
```

Priority images:
- Skip lazy loading
- Add `<link rel="preload">` to `<head>`
- Use `loading="eager"`

### Placeholders

```typescript
// Blur placeholder (LQIP)
<Image
  src="/images/photo.jpg"
  alt="Photo"
  placeholder="blur"
/>

// Custom blur data URL
<Image
  src="/images/photo.jpg"
  alt="Photo"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSk..."
/>

// Solid color placeholder
<Image
  src="/images/photo.jpg"
  alt="Photo"
  placeholder="color"
  placeholderColor="#f0f0f0"
/>

// No placeholder
<Image
  src="/images/photo.jpg"
  alt="Photo"
  placeholder="none"
/>
```

### Object Fit

```typescript
// Cover (crop to fill)
<Image src="/img.jpg" alt="" width={400} height={300} fit="cover" />

// Contain (letterbox)
<Image src="/img.jpg" alt="" width={400} height={300} fit="contain" />

// Fill (stretch)
<Image src="/img.jpg" alt="" width={400} height={300} fit="fill" />
```

---

## Server-Side Optimization

### Configuration

```typescript
import { configure, getConfig } from '@philjs/image';
import type { ImageOptimizationConfig } from '@philjs/image';

configure({
  // Output directory for optimized images
  outputDir: '.philjs/images',

  // Default quality
  quality: 85,

  // Formats to generate
  formats: ['webp', 'avif', 'jpeg'],

  // Responsive breakpoints
  breakpoints: [640, 750, 828, 1080, 1200, 1920, 2048],

  // Cache settings
  cache: {
    ttl: 60 * 60 * 24 * 7, // 1 week
    dir: '.philjs/image-cache',
  },

  // Allowed external domains
  domains: ['images.unsplash.com', 'cdn.example.com'],

  // Image loader
  loader: 'sharp', // or 'cloudinary', 'imgix'
});

const config = getConfig();
```

### Image Optimization

```typescript
import { optimizeImage, getMetadata, generateBlurPlaceholder } from '@philjs/image';
import type { OptimizedImage, ImageMetadata } from '@philjs/image';

// Optimize an image
const optimized: OptimizedImage = await optimizeImage('/images/photo.jpg', {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp',
});

console.log(optimized);
// {
//   src: '/_philjs/images/photo-800x600.webp',
//   width: 800,
//   height: 600,
//   format: 'webp',
//   size: 45678,
// }

// Get image metadata
const metadata: ImageMetadata = await getMetadata('/images/photo.jpg');
console.log(metadata);
// {
//   width: 4000,
//   height: 3000,
//   format: 'jpeg',
//   space: 'srgb',
//   channels: 3,
//   hasAlpha: false,
// }

// Generate blur placeholder
const blurDataURL = await generateBlurPlaceholder('/images/photo.jpg', {
  width: 10,
  quality: 10,
});
```

### Responsive Set Generation

```typescript
import { generateResponsiveSet } from '@philjs/image';

const responsiveSet = await generateResponsiveSet('/images/hero.jpg', {
  widths: [640, 750, 828, 1080, 1200, 1920],
  formats: ['webp', 'jpeg'],
  quality: 85,
});

console.log(responsiveSet);
// {
//   srcSet: '/_philjs/images/hero-640.webp 640w, ...',
//   sizes: '100vw',
//   sources: [
//     { type: 'image/webp', srcSet: '...' },
//     { type: 'image/jpeg', srcSet: '...' },
//   ],
// }
```

### Color Extraction

```typescript
import { extractDominantColor, getDominantColor } from '@philjs/image';

// Extract dominant color for placeholders
const color = await extractDominantColor('/images/photo.jpg');
console.log(color); // '#4a7c59'

// Client-side helper
const placeholderColor = getDominantColor('/images/photo.jpg');
```

---

## Image Services

### Sharp (Default)

```typescript
import { SharpImageService, configureImageService } from '@philjs/image';

configureImageService(new SharpImageService({
  // Sharp-specific options
  progressive: true,
  mozjpeg: true,
}));
```

### Cloudinary

```typescript
import { CloudinaryImageService, configureImageService } from '@philjs/image';

configureImageService(new CloudinaryImageService({
  cloudName: 'your-cloud-name',
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
}));

// Usage - URL transformation
<Image
  src="cloudinary://sample.jpg"
  alt="Sample"
  width={800}
  height={600}
/>
```

### Imgix

```typescript
import { ImgixImageService, configureImageService } from '@philjs/image';

configureImageService(new ImgixImageService({
  domain: 'your-domain.imgix.net',
  secureURLToken: process.env.IMGIX_TOKEN,
}));

// Usage
<Image
  src="imgix://photos/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
/>
```

### Custom Service

```typescript
import type { ImageService, ImageServiceTransformOptions } from '@philjs/image';

class CustomImageService implements ImageService {
  name = 'custom';

  async transform(src: string, options: ImageServiceTransformOptions): Promise<string> {
    const params = new URLSearchParams();
    if (options.width) params.set('w', String(options.width));
    if (options.height) params.set('h', String(options.height));
    if (options.quality) params.set('q', String(options.quality));
    if (options.format) params.set('fm', options.format);

    return `https://custom-cdn.com/${src}?${params}`;
  }

  async getMetadata(src: string): Promise<ImageServiceMetadata> {
    // Fetch metadata from service
    const response = await fetch(`https://custom-cdn.com/${src}/info`);
    return response.json();
  }
}

configureImageService(new CustomImageService());
```

---

## Utilities

### URL Generation

```typescript
import { getOptimizedUrl, generateSrcSet, isExternalUrl } from '@philjs/image';

// Get optimized URL
const url = getOptimizedUrl('/images/photo.jpg', {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 85,
});
// '/_philjs/images/photo.jpg?w=800&h=600&fm=webp&q=85'

// Generate srcset
const srcSet = generateSrcSet('/images/photo.jpg', {
  width: 1200,
  widths: [400, 800, 1200],
  formats: ['webp'],
});
// '/photo-400.webp 400w, /photo-800.webp 800w, /photo-1200.webp 1200w'

// Check if external
isExternalUrl('/images/local.jpg'); // false
isExternalUrl('https://cdn.example.com/image.jpg'); // true
```

### Format Detection

```typescript
import { getFormatFromSrc, isValidFormat, selectOptimalFormat } from '@philjs/image';

// Get format from URL
getFormatFromSrc('/images/photo.jpg'); // 'jpeg'
getFormatFromSrc('/images/logo.png'); // 'png'

// Validate format
isValidFormat('webp'); // true
isValidFormat('bmp'); // false

// Select optimal format based on browser support
const format = selectOptimalFormat({
  supportsAvif: true,
  supportsWebp: true,
});
// 'avif'
```

### Aspect Ratio

```typescript
import { calculateAspectRatio, getResponsiveSizes } from '@philjs/image';

// Calculate aspect ratio
const ratio = calculateAspectRatio(1920, 1080);
// 1.777... (16:9)

// Get responsive sizes
const sizes = getResponsiveSizes({
  width: 800,
  breakpoints: [
    { maxWidth: 640, size: '100vw' },
    { maxWidth: 1024, size: '50vw' },
    { size: '800px' },
  ],
});
// '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px'
```

### Cache Key Generation

```typescript
import { createCacheKey } from '@philjs/image';

const key = createCacheKey('/images/photo.jpg', {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 85,
});
// 'photo-800x600-q85.webp'
```

---

## Types Reference

```typescript
// Optimized image result
interface OptimizedImage {
  src: string;
  width: number;
  height: number;
  format: ImageFormat;
  size: number;
  srcSet?: string;
}

// Image metadata
interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  space: string;
  channels: number;
  hasAlpha: boolean;
  isAnimated?: boolean;
  pages?: number;
}

// Transform options
interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: ImageFit;
  position?: ImagePosition;
  background?: string;
}

// Image service interface
interface ImageService {
  name: string;
  transform(src: string, options: ImageServiceTransformOptions): Promise<string>;
  getMetadata(src: string): Promise<ImageServiceMetadata>;
}

// Configuration
interface ImageOptimizationConfig {
  outputDir: string;
  quality: number;
  formats: ImageFormat[];
  breakpoints: number[];
  cache: {
    ttl: number;
    dir: string;
  };
  domains: string[];
  loader: 'sharp' | 'cloudinary' | 'imgix' | 'custom';
}

// Art direction source
interface ArtDirectionSource {
  media: string;
  src: string;
  width?: number;
  height?: number;
}

// Loading animation
type LoadingAnimation = 'fade' | 'blur' | 'none';
```

---

## Best Practices

### 1. Always Specify Dimensions

```typescript
// Good - prevents layout shift
<Image src="/img.jpg" alt="" width={800} height={600} />

// Avoid - causes CLS
<Image src="/img.jpg" alt="" />
```

### 2. Use Priority for LCP Images

```typescript
// Good - hero image loads fast
<Image src="/hero.jpg" alt="" priority />

// Avoid - hero image lazy loaded
<Image src="/hero.jpg" alt="" />
```

### 3. Provide Meaningful Alt Text

```typescript
// Good - descriptive
<Image src="/cat.jpg" alt="Orange tabby cat sleeping on blue cushion" />

// Decorative - empty alt
<Image src="/decoration.jpg" alt="" />

// Avoid - generic
<Image src="/cat.jpg" alt="Image" />
```

### 4. Use Appropriate Sizes

```typescript
// Good - matches layout
<Image
  src="/product.jpg"
  alt="Product"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
/>

// Avoid - always full width
<Image src="/product.jpg" alt="Product" sizes="100vw" />
```

---

## API Reference

### Components

| Export | Description |
|--------|-------------|
| `Image` | Optimized image component |

### Server Utilities

| Export | Description |
|--------|-------------|
| `configure` | Set image config |
| `getConfig` | Get current config |
| `optimizeImage` | Optimize single image |
| `getMetadata` | Get image metadata |
| `generateBlurPlaceholder` | Generate blur data URL |
| `generateResponsiveSet` | Generate responsive srcset |
| `extractDominantColor` | Extract dominant color |
| `isSharpAvailable` | Check Sharp availability |

### Image Services

| Export | Description |
|--------|-------------|
| `SharpImageService` | Sharp-based service |
| `CloudinaryImageService` | Cloudinary adapter |
| `ImgixImageService` | Imgix adapter |
| `ImageServiceRegistry` | Service registry |
| `configureImageService` | Set active service |
| `getImageService` | Get active service |

### Utilities

| Export | Description |
|--------|-------------|
| `isExternalUrl` | Check if URL is external |
| `generateSrcSet` | Generate srcset string |
| `getOptimizedUrl` | Get optimized URL |
| `generateBlurDataURL` | Client blur URL |
| `getFormatFromSrc` | Detect format |
| `calculateAspectRatio` | Calculate ratio |
| `getResponsiveSizes` | Generate sizes attr |
| `isValidFormat` | Validate format |
| `getDominantColor` | Get dominant color |
| `createCacheKey` | Create cache key |
| `selectOptimalFormat` | Select best format |
| `getFormatPriority` | Get format priority |

---

## Next Steps

- [Performance: Images](../../performance/images.md)
- [@philjs/meta SEO](../meta/overview.md)
- [SSR Overview](../../ssr/overview.md)
