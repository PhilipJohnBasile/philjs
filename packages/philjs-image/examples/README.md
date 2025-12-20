# PhilJS Image - Advanced Usage Examples

This directory contains comprehensive examples demonstrating all features of PhilJS Image optimization.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Advanced Features](#advanced-features)
- [Image Services](#image-services)
- [Build-Time Processing](#build-time-processing)

## Basic Usage

### Simple Optimized Image

```tsx
import { Image } from 'philjs-image';

<Image
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
/>
```

### Modern Formats (AVIF, WebP)

```tsx
<Image
  src="/images/product.jpg"
  alt="Product"
  width={800}
  height={600}
  formats={['avif', 'webp', 'jpeg']}
  quality={90}
/>
```

### Lazy Loading with Blur Placeholder

```tsx
<Image
  src="/images/gallery.jpg"
  alt="Gallery image"
  width={600}
  height={400}
  loading="lazy"
  placeholder="blur"
  loadingAnimation="fade"
/>
```

### Priority Image (LCP Optimization)

```tsx
<Image
  src="/images/hero-banner.jpg"
  alt="Hero banner"
  width={1920}
  height={1080}
  priority={true}
  fetchPriority="high"
  formats={['avif', 'webp', 'jpeg']}
/>
```

## Advanced Features

### Aspect Ratio Locking

```tsx
<Image
  src="/images/product.jpg"
  alt="Product"
  width={400}
  aspectRatio="16:9"
  maintainAspectRatio={true}
  fit="cover"
/>
```

Or use numeric aspect ratio:

```tsx
<Image
  src="/images/product.jpg"
  alt="Product"
  width={400}
  aspectRatio={16/9}
  maintainAspectRatio={true}
/>
```

### Art Direction (Different Images for Breakpoints)

```tsx
import type { ArtDirectionSource } from 'philjs-image';

const artDirection: ArtDirectionSource[] = [
  {
    media: '(max-width: 640px)',
    src: '/images/hero-mobile.jpg',
    width: 640,
    height: 800,
  },
  {
    media: '(max-width: 1024px)',
    src: '/images/hero-tablet.jpg',
    width: 1024,
    height: 768,
  },
  {
    media: '(min-width: 1025px)',
    src: '/images/hero-desktop.jpg',
    width: 1920,
    height: 1080,
  },
];

<Image
  src="/images/hero-desktop.jpg"
  alt="Responsive hero"
  width={1920}
  height={1080}
  artDirection={artDirection}
  formats={['avif', 'webp', 'jpeg']}
/>
```

### Loading Animations

Available animations: `fade`, `blur`, `scale`, `none`

```tsx
// Fade animation
<Image
  src="/images/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  loadingAnimation="fade"
  animationDuration={500}
/>

// Blur animation
<Image
  src="/images/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  loadingAnimation="blur"
  animationDuration={500}
/>

// Scale animation
<Image
  src="/images/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  loadingAnimation="scale"
  animationDuration={500}
/>
```

### BlurHash Placeholder

```tsx
// BlurHash generated at build time
const blurHash = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

<Image
  src="/images/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  blurHash={blurHash}
/>
```

### Base64 LQIP (Low Quality Image Placeholder)

```tsx
const blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

<Image
  src="/images/landscape.jpg"
  alt="Landscape"
  width={1200}
  height={800}
  blurDataURL={blurDataURL}
/>
```

### Dominant Color Placeholder

```tsx
<Image
  src="/images/product.jpg"
  alt="Product"
  width={400}
  height={400}
  placeholder="color"
  placeholderColor="#e0e0e0"
/>
```

## Image Services

PhilJS supports multiple image transformation services:

- **Sharp** - Local image processing (build-time)
- **Cloudinary** - Cloud-based image service
- **imgix** - Cloud-based image CDN

### Cloudinary Service

```tsx
import { configureImageService } from 'philjs-image';

// Configure Cloudinary
configureImageService('cloudinary', {
  cloudName: 'your-cloud-name',
});

// Use in components
<Image
  src="/sample.jpg"
  alt="Cloudinary image"
  width={800}
  height={600}
  service="cloudinary"
/>
```

### imgix Service

```tsx
import { configureImageService } from 'philjs-image';

// Configure imgix
configureImageService('imgix', {
  domain: 'your-domain.imgix.net',
});

// Use in components
<Image
  src="/sample.jpg"
  alt="imgix image"
  width={800}
  height={600}
  service="imgix"
/>
```

### Sharp (Local) Service

```tsx
import { configureImageService } from 'philjs-image';

// Configure Sharp for local processing
configureImageService('sharp');

<Image
  src="/sample.jpg"
  alt="Local image"
  width={800}
  height={600}
/>
```

## Build-Time Processing

### Generate Blur Placeholder

```tsx
import { generateBlurPlaceholder } from 'philjs-image';
import fs from 'fs/promises';

// At build time
const imageBuffer = await fs.readFile('/path/to/image.jpg');

// Base64 blur placeholder
const blurDataURL = await generateBlurPlaceholder(imageBuffer, {
  type: 'base64',
  width: 10,
  height: 10,
  quality: 50,
  blurAmount: 10,
});

// BlurHash
const blurHash = await generateBlurPlaceholder(imageBuffer, {
  type: 'blurhash',
});

// LQIP
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

### Extract Image Metadata

```tsx
import { getMetadata } from 'philjs-image';

const metadata = await getMetadata(imageBuffer);
console.log(metadata);
// {
//   width: 1920,
//   height: 1080,
//   format: 'jpeg',
//   size: 256000,
//   aspectRatio: 1.777,
//   dominantColor: '#3366cc'
// }
```

### Generate Responsive Image Set

```tsx
import { generateResponsiveSet } from 'philjs-image';

const responsiveSet = await generateResponsiveSet(imageBuffer, {
  formats: ['avif', 'webp', 'jpeg'],
  breakpoints: [640, 750, 828, 1080, 1200, 1920],
  quality: 85,
});

// Returns array of optimized images:
// [
//   { buffer: Buffer, width: 640, format: 'avif' },
//   { buffer: Buffer, width: 640, format: 'webp' },
//   { buffer: Buffer, width: 640, format: 'jpeg' },
//   ...
// ]
```

### Optimize Single Image

```tsx
import { optimizeImage } from 'philjs-image';

const optimized = await optimizeImage(imageBuffer, {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 85,
  fit: 'cover',
});

// Save optimized image
await fs.writeFile('/path/to/output.webp', optimized);
```

## Configuration

### Global Configuration

```tsx
import { configure } from 'philjs-image';

configure({
  formats: ['avif', 'webp', 'jpeg'],
  quality: 85,
  qualityByFormat: {
    jpeg: 85,
    webp: 85,
    avif: 75,
    png: 90,
  },
  breakpoints: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  sharpOptions: {
    progressive: true,
    optimizeScans: true,
    effort: 6,
  },
});
```

## Common Patterns

### Product Image Card

```tsx
<div style={{ maxWidth: '400px' }}>
  <Image
    src="/product.jpg"
    alt="Product"
    width={400}
    aspectRatio={1}
    maintainAspectRatio={true}
    fit="cover"
    formats={['avif', 'webp', 'jpeg']}
    loading="lazy"
    placeholder="color"
    placeholderColor="#f5f5f5"
  />
</div>
```

### Hero Banner

```tsx
<Image
  src="/hero-banner.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority={true}
  fetchPriority="high"
  formats={['avif', 'webp', 'jpeg']}
  quality={90}
  fit="cover"
/>
```

### Circular Avatar

```tsx
<Image
  src="/avatar.jpg"
  alt="Avatar"
  width={120}
  height={120}
  aspectRatio={1}
  fit="cover"
  style={{ borderRadius: '50%' }}
  placeholder="color"
  placeholderColor="#e0e0e0"
/>
```

### Responsive Gallery

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '1rem'
}}>
  {images.map(image => (
    <Image
      src={image.src}
      alt={image.alt}
      width={600}
      aspectRatio="16:9"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      formats={['avif', 'webp', 'jpeg']}
      loading="lazy"
      placeholder="blur"
    />
  ))}
</div>
```

## Performance Tips

1. **Use priority for LCP images**: Set `priority={true}` and `fetchPriority="high"` for above-the-fold images
2. **Lazy load below-the-fold images**: Use `loading="lazy"` for images not immediately visible
3. **Choose appropriate formats**: Use `['avif', 'webp', 'jpeg']` for best browser support
4. **Optimize quality**: Use quality 85 for photos, 90 for product images, 75 for AVIF
5. **Use blur placeholders**: Improve perceived performance with `placeholder="blur"`
6. **Lock aspect ratios**: Prevent layout shift with `aspectRatio` and `maintainAspectRatio`
7. **Use art direction**: Serve optimized images per breakpoint with `artDirection`
8. **Generate placeholders at build time**: Pre-generate BlurHash or LQIP for best performance

## License

MIT
