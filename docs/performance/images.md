# Image Optimization

Optimize images for faster load times and better performance.

## Responsive Images

### Picture Element

```tsx
export default function ResponsiveImage({ src, alt }) {
  return (
    <picture>
      <source
        srcSet={`${src}?w=320 320w, ${src}?w=640 640w, ${src}?w=1280 1280w`}
        sizes="(max-width: 640px) 320px, (max-width: 1280px) 640px, 1280px"
      />
      <img src={src} alt={alt} loading="lazy" />
    </picture>
  );
}
```

## Lazy Loading

### Native Lazy Loading

```tsx
<img
  src="/image.jpg"
  alt="Lazy loaded"
  loading="lazy"
/>
```

### Intersection Observer

```tsx
import { signal, effect } from '@philjs/core';

export default function LazyImage({ src, alt }) {
  const isVisible = signal(false);
  let imgRef: HTMLImageElement;

  effect(() => {
    if (!imgRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        isVisible.set(true);
        observer.disconnect();
      }
    });

    observer.observe(imgRef);
    onCleanup(() => observer.disconnect());
  });

  return (
    <img
      ref={imgRef}
      src={isVisible() ? src : 'data:image/svg+xml,...'}
      alt={alt}
    />
  );
}
```

## Next Steps

- [Performance](/docs/performance/overview.md) - Performance guide
- [Lazy Loading](/docs/performance/lazy-loading.md) - Lazy patterns

---

💡 **Tip**: Always use lazy loading for below-the-fold images.

⚠️ **Warning**: Optimize images before uploading—don't rely on runtime optimization.

ℹ️ **Note**: Modern formats like WebP and AVIF offer better compression than JPEG.
