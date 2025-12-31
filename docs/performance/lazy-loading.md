# Lazy Loading

Defer loading of resources until they're needed to improve initial page load.

## What You'll Learn

- Image lazy loading
- Component lazy loading
- Intersection Observer
- Progressive loading
- Resource priorities
- Best practices

## Image Lazy Loading

### Native Lazy Loading

```typescript
export function LazyImage({ src, alt }: {
  src: string;
  alt: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width="800"
      height="600"
    />
  );
}
```

### Intersection Observer

```typescript
import { signal, effect } from '@philjs/core';

export function IntersectionLazyImage({ src, alt }: {
  src: string;
  alt: string;
}) {
  const isVisible = signal(false);
  const loaded = signal(false);
  let imgRef: HTMLImageElement | undefined;

  effect(() => {
    if (!imgRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loaded()) {
            isVisible.set(true);
            loaded.set(true);
          }
        });
      },
      { rootMargin: '50px' } // Load 50px before visible
    );

    observer.observe(imgRef);

    return () => observer.disconnect();
  });

  return (
    <img
      ref={imgRef}
      src={isVisible() ? src : '/placeholder.jpg'}
      alt={alt}
      style={{ minHeight: '200px' }}
    />
  );
}
```

### Progressive Image Loading

```typescript
import { signal, effect } from '@philjs/core';

export function ProgressiveImage({ src, placeholder, alt }: {
  src: string;
  placeholder: string;
  alt: string;
}) {
  const currentSrc = signal(placeholder);
  const isLoaded = signal(false);

  effect(() => {
    const img = new Image();

    img.onload = () => {
      currentSrc.set(src);
      isLoaded.set(true);
    };

    img.src = src;
  });

  return (
    <img
      src={currentSrc()}
      alt={alt}
      style={{
        filter: isLoaded() ? 'none' : 'blur(10px)',
        transition: 'filter 0.3s'
      }}
    />
  );
}
```

### Blur Hash Implementation

```typescript
import { signal, effect } from '@philjs/core';

export function BlurHashImage({ src, blurHash, alt }: {
  src: string;
  blurHash: string; // Base64 blur hash
  alt: string;
}) {
  const loaded = signal(false);

  effect(() => {
    const img = new Image();
    img.onload = () => loaded.set(true);
    img.src = src;
  });

  return (
    <div style={{ position: 'relative' }}>
      {/* Blur hash background */}
      <img
        src={blurHash}
        alt=""
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          opacity: loaded() ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
      />

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        style={{
          position: 'relative',
          width: '100%',
          opacity: loaded() ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
      />
    </div>
  );
}
```

## Component Lazy Loading

### Visibility-Based Loading

```typescript
import { signal, effect } from '@philjs/core';

function useLazyLoad() {
  const isVisible = signal(false);
  let ref: HTMLElement | undefined;

  effect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          isVisible.set(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  });

  return { isVisible, ref };
}

export function LazySection() {
  const { isVisible, ref } = useLazyLoad();

  return (
    <div ref={ref}>
      {isVisible() ? (
        <HeavyComponent />
      ) : (
        <div style={{ minHeight: '400px' }}>
          Loading section...
        </div>
      )}
    </div>
  );
}
```

### Scroll-Based Loading

```typescript
import { signal, effect } from '@philjs/core';

export function ScrollLazyLoad({ children }: { children: any }) {
  const shouldLoad = signal(false);

  effect(() => {
    const checkScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercent > 30) {
        shouldLoad.set(true);
        window.removeEventListener('scroll', checkScroll);
      }
    };

    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Check initial position

    return () => window.removeEventListener('scroll', checkScroll);
  });

  return shouldLoad() ? children : null;
}

// Usage
<ScrollLazyLoad>
  <Footer />
</ScrollLazyLoad>
```

## Background Loading

### Idle Time Loading

```typescript
import { effect } from '@philjs/core';

function loadDuringIdle(importFn: () => Promise<any>) {
  effect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn();
      });
    } else {
      // Fallback for Safari
      setTimeout(() => {
        importFn();
      }, 1);
    }
  });
}

// Usage
export function App() {
  effect(() => {
    // Preload non-critical components during idle time
    loadDuringIdle(() => import('./components/Analytics'));
    loadDuringIdle(() => import('./components/ChatWidget'));
  });

  return <MainApp />;
}
```

### Priority Queue Loading

```typescript
import { signal } from '@philjs/core';

interface LoadTask {
  priority: number;
  load: () => Promise<any>;
  name: string;
}

class ResourceLoader {
  private queue = signal<LoadTask[]>([]);
  private loading = signal(false);

  addTask(task: LoadTask) {
    const updated = [...this.queue(), task]
      .sort((a, b) => b.priority - a.priority);

    this.queue.set(updated);
    this.processQueue();
  }

  private async processQueue() {
    if (this.loading() || this.queue().length === 0) return;

    this.loading.set(true);
    const task = this.queue()[0];

    try {
      await task.load();
      console.log(`Loaded: ${task.name}`);
    } catch (error) {
      console.error(`Failed to load: ${task.name}`, error);
    }

    this.queue.set(this.queue().slice(1));
    this.loading.set(false);

    this.processQueue();
  }
}

const loader = new ResourceLoader();

// Usage
loader.addTask({
  priority: 10,
  name: 'Critical Analytics',
  load: () => import('./analytics')
});

loader.addTask({
  priority: 5,
  name: 'Chat Widget',
  load: () => import('./chat')
});
```

## Video Lazy Loading

### Lazy Video Element

```typescript
import { signal, effect } from '@philjs/core';

export function LazyVideo({ src, poster }: {
  src: string;
  poster: string;
}) {
  const isVisible = signal(false);
  const shouldLoad = signal(false);
  let videoRef: HTMLVideoElement | undefined;

  effect(() => {
    if (!videoRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.set(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef);

    return () => observer.disconnect();
  });

  effect(() => {
    if (isVisible() && !shouldLoad()) {
      shouldLoad.set(true);
    }
  });

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      preload={shouldLoad() ? 'auto' : 'none'}
    >
      {shouldLoad() && <source src={src} type="video/mp4" />}
    </video>
  );
}
```

### Autoplay on Visible

```typescript
export function AutoplayVideo({ src }: { src: string }) {
  const isPlaying = signal(false);
  let videoRef: HTMLVideoElement | undefined;

  effect(() => {
    if (!videoRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPlaying()) {
            videoRef?.play();
            isPlaying.set(true);
          } else if (!entry.isIntersecting && isPlaying()) {
            videoRef?.pause();
            isPlaying.set(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef);

    return () => observer.disconnect();
  });

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop
      playsInline
    />
  );
}
```

## Resource Hints

### Prefetch Resources

```typescript
function prefetchResource(url: string, type: 'script' | 'style' | 'fetch' = 'fetch') {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;

  if (type === 'script') {
    link.as = 'script';
  } else if (type === 'style') {
    link.as = 'style';
  } else {
    link.as = 'fetch';
    link.setAttribute('crossorigin', 'anonymous');
  }

  document.head.appendChild(link);
}

// Usage
export function App() {
  effect(() => {
    // Prefetch likely next page
    prefetchResource('/dashboard.js', 'script');
    prefetchResource('/api/user-data', 'fetch');
  });

  return <HomePage />;
}
```

### Preload Critical Resources

```typescript
function preloadResource(url: string, type: 'script' | 'style' | 'font' | 'image') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;

  if (type === 'font') {
    link.setAttribute('crossorigin', 'anonymous');
  }

  document.head.appendChild(link);
}

// Preload critical resources early
preloadResource('/fonts/main.woff2', 'font');
preloadResource('/hero-image.jpg', 'image');
preloadResource('/critical.css', 'style');
```

## Font Loading

### Font Display Swap

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately */
}
```

### Progressive Font Loading

```typescript
import { signal, effect } from '@philjs/core';

export function useFontLoading(fontFamily: string) {
  const isLoaded = signal(false);

  effect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        // Check if specific font is loaded
        const loaded = document.fonts.check(`16px ${fontFamily}`);
        isLoaded.set(loaded);
      });
    }
  });

  return isLoaded;
}

// Usage
export function App() {
  const fontLoaded = useFontLoading('CustomFont');

  return (
    <div style={{
      fontFamily: fontLoaded()
        ? 'CustomFont, sans-serif'
        : 'sans-serif'
    }}>
      Content
    </div>
  );
}
```

## Best Practices

### Lazy Load Below the Fold

```typescript
// ✅ Lazy load content not immediately visible
function HomePage() {
  return (
    <div>
      <Hero />  {/* Eager load above fold */}

      <LazyLoad>
        <Features />  {/* Lazy load below fold */}
      </LazyLoad>

      <LazyLoad>
        <Testimonials />  {/* Lazy load below fold */}
      </LazyLoad>
    </div>
  );
}
```

### Set Image Dimensions

```typescript
// ✅ Reserve space to avoid layout shift
<img
  src="/image.jpg"
  loading="lazy"
  width="800"
  height="600"
  alt="Description"
/>

// ❌ No dimensions (causes layout shift)
<img
  src="/image.jpg"
  loading="lazy"
  alt="Description"
/>
```

### Use Appropriate Root Margin

```typescript
// ✅ Load before visible for smooth experience
const observer = new IntersectionObserver(callback, {
  rootMargin: '50px' // Load 50px before viewport
});

// ❌ Load only when visible (may show loading state)
const observer = new IntersectionObserver(callback, {
  rootMargin: '0px'
});
```

### Prioritize Critical Resources

```typescript
// ✅ Preload critical, lazy load non-critical
<link rel="preload" href="/critical.css" as="style" />
<img src="/hero.jpg" loading="eager" />
<img src="/feature.jpg" loading="lazy" />

// ❌ Lazy load everything
<img src="/hero.jpg" loading="lazy" />  // Hero should load immediately
```

### Clean Up Observers

```typescript
// ✅ Disconnect observer when done
effect(() => {
  const observer = new IntersectionObserver(callback);
  observer.observe(element);

  return () => observer.disconnect();
});

// ❌ Forget to clean up (memory leak)
const observer = new IntersectionObserver(callback);
observer.observe(element);
```

## Summary

You've learned:

✅ Image lazy loading techniques
✅ Component lazy loading
✅ Intersection Observer API
✅ Progressive loading patterns
✅ Background and idle loading
✅ Video lazy loading
✅ Resource hints (prefetch, preload)
✅ Font loading strategies
✅ Best practices

Lazy loading dramatically reduces initial page weight!

---

**Next:** [Memoization →](./memoization.md) Cache expensive computations
